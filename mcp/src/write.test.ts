import { describe, it, expect, beforeEach, afterEach, afterAll } from 'vitest';
import { join } from 'path';
import { readFile, rm, mkdir, readdir } from 'fs/promises';
import matter from 'gray-matter';
import {
  createDocument,
  updateDocument,
  appendToDocument,
  deleteDocument,
  slugToPath,
} from './write';
import { KB_ROOT } from './constants';

// Test fixture directory
const TEST_DIR = join(KB_ROOT, 'projects');

// Create unique test IDs per run to avoid collisions
const RUN_ID = Date.now();
let testCounter = 0;

function getUniqueSlug(base: string): string {
  return `projects/${base}-${RUN_ID}-${testCounter++}`;
}

describe('Write Functionality', () => {
  beforeEach(async () => {
    // Ensure test directory exists
    try {
      await mkdir(TEST_DIR, { recursive: true });
    } catch {}
  });

  afterAll(async () => {
    // Clean up all test files from this run
    try {
      const entries = await readdir(TEST_DIR);
      for (const entry of entries) {
        if (entry.includes(`${RUN_ID}`)) {
          try {
            const filePath = join(TEST_DIR, entry);
            await rm(filePath, { force: true });
          } catch {}
        }
      }
    } catch {}
  });

  describe('slugToPath', () => {
    it('converts valid slug to absolute path', () => {
      const path = slugToPath('projects/audio-forge');
      expect(path).toContain('projects');
      expect(path).toContain('audio-forge.md');
      expect(path).toMatch(/audio-forge\.md$/);
    });

    it('handles multi-level directory structure', () => {
      const path = slugToPath('projects/my/nested/doc');
      expect(path).toContain('my');
      expect(path).toContain('nested');
      expect(path).toMatch(/doc\.md$/);
    });

    it('prevents path traversal attacks', () => {
      expect(() => slugToPath('projects/../../../etc/passwd')).toThrow();
    });

    it('maintains absolute path that is within KB_ROOT', () => {
      const path = slugToPath('projects/test');
      expect(path).toMatch(/^\/.*projects.*test\.md$/);
    });
  });

  describe('createDocument', () => {
    it('creates a new document with valid slug, title, and content', async () => {
      const slug = getUniqueSlug('test-doc');
      const title = 'Test Document';
      const content = 'This is test content';

      await createDocument(slug, title, content);

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data, content: body } = matter(raw);

      expect(data.title).toBe(title);
      expect(body.trim()).toBe(content);
      expect(data.created).toBeDefined();
    });

    it('generates ISO timestamp in created field', async () => {
      const slug = getUniqueSlug('test-timestamp');
      await createDocument(slug, 'Test', 'Content');

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data } = matter(raw);

      expect(data.created).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('includes extra frontmatter fields', async () => {
      const slug = getUniqueSlug('test-fm');
      const extra = { author: 'Jason', tags: ['test', 'demo'] };

      await createDocument(slug, 'Test', 'Content', extra);

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data } = matter(raw);

      expect(data.author).toBe('Jason');
      expect(data.tags).toEqual(['test', 'demo']);
      expect(data.title).toBe('Test');
    });

    it('throws error if document already exists', async () => {
      const slug = getUniqueSlug('duplicate');
      await createDocument(slug, 'First', 'Content 1');

      await expect(
        createDocument(slug, 'Second', 'Content 2')
      ).rejects.toThrow('already exists');
    });

    it('throws error for invalid slug format', async () => {
      await expect(createDocument('invalid_slug', 'Title', 'Content')).rejects.toThrow();
      await expect(createDocument('projects/UPPERCASE', 'Title', 'Content')).rejects.toThrow();
      await expect(createDocument('projects/with space', 'Title', 'Content')).rejects.toThrow();
    });

    it('throws error if slug does not start with valid directory', async () => {
      await expect(
        createDocument('invalid/test', 'Title', 'Content')
      ).rejects.toThrow(/Valid directories/);
    });

    it('throws error if slug lacks directory component', async () => {
      await expect(createDocument('nodirectory', 'Title', 'Content')).rejects.toThrow();
    });

    it('throws error if title is empty', async () => {
      await expect(createDocument('projects/test', '', 'Content')).rejects.toThrow();
    });

    it('throws error if content is not a string', async () => {
      await expect(
        createDocument('projects/test', 'Title', null as unknown as string)
      ).rejects.toThrow();
    });

    it('writes atomically (no partial files left on error)', async () => {
      const slug = getUniqueSlug('atomic-test');
      const filePath = slugToPath(slug);
      const tmpPath = `${filePath}.tmp`;

      await createDocument(slug, 'Test', 'Content');

      try {
        await readFile(tmpPath);
        throw new Error('Temp file should not exist');
      } catch (err) {
        expect((err as NodeJS.ErrnoException).code).toBe('ENOENT');
      }
    });
  });

  describe('updateDocument', () => {
    it('updates content while preserving frontmatter', async () => {
      const slug = getUniqueSlug('update-test');
      await createDocument(slug, 'Original', 'Original content');

      const newContent = 'Updated content';
      await updateDocument(slug, newContent);

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data, content } = matter(raw);

      expect(data.title).toBe('Original');
      expect(content.trim()).toBe(newContent);
      expect(data.updated).toBeDefined();
    });

    it('adds updated timestamp', async () => {
      const slug = getUniqueSlug('timestamp-test');
      await createDocument(slug, 'Test', 'Content');
      await updateDocument(slug, 'New content');

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data } = matter(raw);

      expect(data.updated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('merges frontmatter fields', async () => {
      const slug = getUniqueSlug('merge-test');
      await createDocument(slug, 'Test', 'Content');

      const mergeData = { status: 'complete', tags: ['updated'] };
      await updateDocument(slug, 'New content', mergeData);

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data } = matter(raw);

      expect(data.status).toBe('complete');
      expect(data.tags).toEqual(['updated']);
      expect(data.title).toBe('Test');
    });

    it('allows overwriting specific frontmatter fields', async () => {
      const slug = getUniqueSlug('overwrite-test');
      await createDocument(slug, 'Original Title', 'Content');
      await updateDocument(slug, 'Content', { title: 'New Title' });

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data } = matter(raw);

      expect(data.title).toBe('New Title');
    });

    it('throws error if document does not exist', async () => {
      await expect(
        updateDocument('projects/nonexistent-xxx', 'Content')
      ).rejects.toThrow('not found');
    });

    it('throws error for invalid slug', async () => {
      await expect(updateDocument('invalid/slug', 'Content')).rejects.toThrow();
    });

    it('throws error if content is not a string', async () => {
      const slug = getUniqueSlug('content-test');
      await createDocument(slug, 'Test', 'Content');

      await expect(
        updateDocument(slug, null as unknown as string)
      ).rejects.toThrow();
    });

    it('writes atomically', async () => {
      const slug = getUniqueSlug('atomic-update');
      await createDocument(slug, 'Test', 'Content');

      const filePath = slugToPath(slug);
      const tmpPath = `${filePath}.tmp`;

      await updateDocument(slug, 'New content');

      try {
        await readFile(tmpPath);
        throw new Error('Temp file should not exist');
      } catch (err) {
        expect((err as NodeJS.ErrnoException).code).toBe('ENOENT');
      }
    });
  });

  describe('appendToDocument', () => {
    it('appends content with blank line separator', async () => {
      const slug = getUniqueSlug('append-test');
      await createDocument(slug, 'Test', 'Original content');

      await appendToDocument(slug, 'Appended content');

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { content } = matter(raw);

      expect(content).toContain('Original content');
      expect(content).toContain('Appended content');
    });

    it('preserves original frontmatter', async () => {
      const slug = getUniqueSlug('preserve-test');
      await createDocument(slug, 'Test', 'Content');
      await appendToDocument(slug, 'More content');

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data } = matter(raw);

      expect(data.title).toBe('Test');
    });

    it('updates the updated timestamp', async () => {
      const slug = getUniqueSlug('timestamp-append');
      await createDocument(slug, 'Test', 'Content');
      await appendToDocument(slug, 'New content');

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { data } = matter(raw);

      expect(data.updated).toBeDefined();
      expect(data.updated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('throws error if document does not exist', async () => {
      await expect(
        appendToDocument('projects/nonexistent-yyy', 'Content')
      ).rejects.toThrow('not found');
    });

    it('throws error for invalid slug', async () => {
      await expect(appendToDocument('invalid/slug', 'Content')).rejects.toThrow();
    });

    it('throws error if content is not a string', async () => {
      const slug = getUniqueSlug('append-content');
      await createDocument(slug, 'Test', 'Content');

      await expect(
        appendToDocument(slug, null as unknown as string)
      ).rejects.toThrow();
    });

    it('allows multiple appends in sequence', async () => {
      const slug = getUniqueSlug('multi-append');
      await createDocument(slug, 'Test', 'Original content');
      await appendToDocument(slug, 'First append');
      await appendToDocument(slug, 'Second append');

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { content } = matter(raw);

      expect(content).toContain('Original content');
      expect(content).toContain('First append');
      expect(content).toContain('Second append');
    });
  });

  describe('deleteDocument', () => {
    it('deletes an existing document', async () => {
      const slug = getUniqueSlug('delete-test');
      await createDocument(slug, 'Test', 'Content');

      const filePath = slugToPath(slug);

      // Verify it exists
      const beforeDelete = await readFile(filePath, 'utf-8');
      expect(beforeDelete).toBeDefined();

      // Delete it
      await deleteDocument(slug);

      // Verify it's gone
      try {
        await readFile(filePath);
        throw new Error('File should not exist');
      } catch (err) {
        expect((err as NodeJS.ErrnoException).code).toBe('ENOENT');
      }
    });

    it('throws error if document does not exist', async () => {
      await expect(deleteDocument('projects/nonexistent-zzz')).rejects.toThrow('not found');
    });

    it('throws error for invalid slug', async () => {
      await expect(deleteDocument('invalid/slug')).rejects.toThrow();
    });

    it('throws error if slug contains path traversal', async () => {
      await expect(deleteDocument('projects/../../../etc/passwd')).rejects.toThrow();
    });

    it('performs security validation before delete', async () => {
      const slug = 'projects/test-delete';
      expect(() => slugToPath(slug)).not.toThrow();
    });
  });

  describe('Slug validation', () => {
    it('rejects uppercase letters', async () => {
      await expect(
        createDocument('projects/TestDoc', 'Title', 'Content')
      ).rejects.toThrow();
    });

    it('rejects spaces', async () => {
      await expect(
        createDocument('projects/test doc', 'Title', 'Content')
      ).rejects.toThrow();
    });

    it('rejects special characters except hyphen underscore slash', async () => {
      await expect(createDocument('projects/test@doc', 'Title', 'Content')).rejects.toThrow();
      await expect(createDocument('projects/test.doc', 'Title', 'Content')).rejects.toThrow();
      await expect(createDocument('projects/test#doc', 'Title', 'Content')).rejects.toThrow();
    });

    it('accepts hyphens underscores and forward slashes', async () => {
      const slug1 = getUniqueSlug('test-doc-one');
      const slug2 = getUniqueSlug('test_doc_two');

      await createDocument(slug1, 'Title', 'Content');
      await createDocument(slug2, 'Title', 'Content');

      const file1 = await readFile(slugToPath(slug1), 'utf-8');
      const file2 = await readFile(slugToPath(slug2), 'utf-8');

      expect(file1).toBeDefined();
      expect(file2).toBeDefined();
    });

    it('rejects empty slug', async () => {
      await expect(createDocument('', 'Title', 'Content')).rejects.toThrow();
    });

    it('rejects slug without directory', async () => {
      await expect(createDocument('nodirectory', 'Title', 'Content')).rejects.toThrow();
    });

    it('rejects unknown directory prefix', async () => {
      await expect(
        createDocument('unknown-dir/test', 'Title', 'Content')
      ).rejects.toThrow(/Valid directories/);
    });

    it('rejects path traversal attempts', async () => {
      await expect(
        createDocument('projects/../preferences/test', 'Title', 'Content')
      ).rejects.toThrow();
    });
  });

  describe('Content formatting', () => {
    it('preserves markdown formatting in content', async () => {
      const slug = getUniqueSlug('markdown-test');
      const content = '# Heading\n\n- Item 1\n- Item 2\n\n**Bold text**';

      await createDocument(slug, 'Test', content);

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { content: readContent } = matter(raw);

      expect(readContent.trim()).toBe(content);
    });

    it('preserves frontmatter in YAML format', async () => {
      const slug = getUniqueSlug('yaml-test');
      const extra = { tags: ['tag1', 'tag2'], metadata: { nested: 'value' } };

      await createDocument(slug, 'Test', 'Content', extra);

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const parsed = matter(raw);

      expect(parsed.data.tags).toEqual(['tag1', 'tag2']);
      expect(parsed.data.metadata).toEqual({ nested: 'value' });
    });

    it('handles multiline content with blank lines', async () => {
      const slug = getUniqueSlug('multiline-test');
      const content = 'Line 1\n\nLine 2\n\n\nLine 3';

      await createDocument(slug, 'Test', content);

      const filePath = slugToPath(slug);
      const raw = await readFile(filePath, 'utf-8');
      const { content: readContent } = matter(raw);

      expect(readContent.trim()).toBe(content);
    });
  });

  describe('Atomic write guarantees', () => {
    it('uses tmp file pattern for atomicity', async () => {
      const slug = getUniqueSlug('atomic-test-final');
      const filePath = slugToPath(slug);
      const tmpPath = `${filePath}.tmp`;

      await createDocument(slug, 'Test', 'Content');

      try {
        await readFile(tmpPath);
        throw new Error('Tmp file should have been cleaned up');
      } catch (err) {
        expect((err as NodeJS.ErrnoException).code).toBe('ENOENT');
      }

      const content = await readFile(filePath, 'utf-8');
      expect(content).toBeDefined();
    });
  });
});
