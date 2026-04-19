import { writeFile, readFile, rm } from 'fs/promises';
import { resolve, isAbsolute } from 'path';
import matter from 'gray-matter';
import { KB_ROOT, KB_DIRS } from './constants.js';

/**
 * Validate slug format and location
 * - Only [a-z0-9_-/] allowed
 * - Must start with valid KB_DIR
 * - No .. traversal allowed
 */
function validateSlug(slug: string): void {
  if (!slug || typeof slug !== 'string') {
    throw new Error('Slug must be a non-empty string');
  }

  if (!/^[a-z0-9_\-/]+$/.test(slug)) {
    throw new Error(
      `Invalid slug format: "${slug}". Only lowercase letters, numbers, underscore, hyphen, and forward slash allowed`
    );
  }

  if (slug.includes('..')) {
    throw new Error('Path traversal (..) not allowed in slug');
  }

  const parts = slug.split('/');
  if (parts.length < 2) {
    throw new Error('Slug must include at least one directory level (e.g., "projects/my-note")');
  }

  const dir = parts[0];
  if (!KB_DIRS.includes(dir)) {
    throw new Error(
      `Slug must start with valid KB directory. Valid directories: ${KB_DIRS.join(', ')}`
    );
  }
}

/**
 * Convert slug to absolute file path with security validation
 * - Resolves path to absolute
 * - Verifies it's strictly within KB_ROOT (prevents directory traversal)
 */
export function slugToPath(slug: string): string {
  const parts = slug.split('/');
  const dirName = parts[0];
  const fileName = parts.slice(1).join('/');
  const filePath = resolve(KB_ROOT, dirName, `${fileName}.md`);

  // Security check: ensure resolved path is within KB_ROOT
  const normalized = resolve(filePath);
  const rootNormalized = resolve(KB_ROOT);
  if (!normalized.startsWith(rootNormalized + '/') && normalized !== rootNormalized) {
    throw new Error(`Path traversal attempt detected: ${slug}`);
  }

  return normalized;
}

/**
 * Generate YAML frontmatter for a document
 */
function generateFrontmatter(
  title: string,
  extra?: Record<string, unknown>
): Record<string, unknown> {
  const now = new Date().toISOString();
  return {
    title,
    created: now,
    ...extra,
  };
}

/**
 * Format frontmatter and content into markdown file
 */
function formatDocument(
  frontmatter: Record<string, unknown>,
  content: string
): string {
  const fm = matter.stringify(content, frontmatter);
  return fm;
}

/**
 * Create a new document
 * - Validates slug format and location
 * - Generates frontmatter with title and created date
 * - Writes atomically: write to .tmp then rename
 * - Throws if file already exists
 */
export async function createDocument(
  slug: string,
  title: string,
  content: string,
  extraFrontmatter?: Record<string, unknown>
): Promise<void> {
  validateSlug(slug);

  if (!title || typeof title !== 'string') {
    throw new Error('Title must be a non-empty string');
  }

  if (typeof content !== 'string') {
    throw new Error('Content must be a string');
  }

  const filePath = slugToPath(slug);
  const tmpPath = `${filePath}.tmp`;

  // Check if file already exists
  try {
    await readFile(filePath, 'utf-8');
    throw new Error(`Document already exists: "${slug}"`);
  } catch (err) {
    // Expected: file should not exist
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      if (err instanceof Error && err.message.includes('Document already exists')) {
        throw err;
      }
      throw new Error(`Failed to check if document exists: ${(err as Error).message}`);
    }
  }

  const frontmatter = generateFrontmatter(title, extraFrontmatter);
  const markdown = formatDocument(frontmatter, content);

  // Atomic write: write to tmp, then rename
  try {
    await writeFile(tmpPath, markdown, 'utf-8');
    // Rename is atomic on same filesystem
    // Using fs.promises.rename (wrapper around os.rename)
    const { rename } = await import('fs/promises');
    await rename(tmpPath, filePath);
  } catch (err) {
    // Clean up tmp file if write failed
    try {
      await rm(tmpPath, { force: true });
    } catch {}
    throw new Error(`Failed to create document: ${(err as Error).message}`);
  }
}

/**
 * Update an existing document
 * - Reads existing frontmatter, merges with provided fields
 * - Adds/updates updated date
 * - Rewrites atomically
 * - Throws if file doesn't exist
 */
export async function updateDocument(
  slug: string,
  content: string,
  mergeFrontmatter?: Record<string, unknown>
): Promise<void> {
  validateSlug(slug);

  if (typeof content !== 'string') {
    throw new Error('Content must be a string');
  }

  const filePath = slugToPath(slug);
  const tmpPath = `${filePath}.tmp`;

  // Read existing file
  let existingData: Record<string, unknown> = {};
  try {
    const raw = await readFile(filePath, 'utf-8');
    const { data } = matter(raw);
    existingData = data;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Document not found: "${slug}"`);
    }
    throw new Error(`Failed to read document: ${(err as Error).message}`);
  }

  // Merge frontmatter
  const now = new Date().toISOString();
  const newFrontmatter = {
    ...existingData,
    ...mergeFrontmatter,
    updated: now,
  };

  const markdown = formatDocument(newFrontmatter, content);

  // Atomic write
  try {
    await writeFile(tmpPath, markdown, 'utf-8');
    const { rename } = await import('fs/promises');
    await rename(tmpPath, filePath);
  } catch (err) {
    try {
      await rm(tmpPath, { force: true });
    } catch {}
    throw new Error(`Failed to update document: ${(err as Error).message}`);
  }
}

/**
 * Append content to an existing document
 * - Reads existing file, preserves frontmatter
 * - Appends content to markdown body
 * - Updates updated date in frontmatter
 * - Writes atomically
 */
export async function appendToDocument(slug: string, content: string): Promise<void> {
  validateSlug(slug);

  if (typeof content !== 'string') {
    throw new Error('Content must be a string');
  }

  const filePath = slugToPath(slug);
  const tmpPath = `${filePath}.tmp`;

  // Read existing file
  let existingData: Record<string, unknown> = {};
  let existingContent = '';
  try {
    const raw = await readFile(filePath, 'utf-8');
    const { data, content: body } = matter(raw);
    existingData = data;
    existingContent = body;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Document not found: "${slug}"`);
    }
    throw new Error(`Failed to read document: ${(err as Error).message}`);
  }

  // Append to content
  const newContent = existingContent + '\n\n' + content;

  // Update frontmatter with new timestamp
  const now = new Date().toISOString();
  const updatedData = {
    ...existingData,
    updated: now,
  };

  const markdown = formatDocument(updatedData, newContent);

  // Atomic write
  try {
    await writeFile(tmpPath, markdown, 'utf-8');
    const { rename } = await import('fs/promises');
    await rename(tmpPath, filePath);
  } catch (err) {
    try {
      await rm(tmpPath, { force: true });
    } catch {}
    throw new Error(`Failed to append to document: ${(err as Error).message}`);
  }
}

/**
 * Delete a document
 * - Validates path is within KB_ROOT (security check)
 * - Unlinks the file
 * - Throws if file doesn't exist
 */
export async function deleteDocument(slug: string): Promise<void> {
  validateSlug(slug);

  const filePath = slugToPath(slug);

  // Security verification: ensure path is strictly within KB_ROOT
  const normalized = resolve(filePath);
  const rootNormalized = resolve(KB_ROOT);
  if (!normalized.startsWith(rootNormalized + '/') && normalized !== rootNormalized) {
    throw new Error(`Security error: path is outside KB_ROOT`);
  }

  try {
    await rm(filePath, { force: false }); // force: false throws if file doesn't exist
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Document not found: "${slug}"`);
    }
    throw new Error(`Failed to delete document: ${(err as Error).message}`);
  }
}
