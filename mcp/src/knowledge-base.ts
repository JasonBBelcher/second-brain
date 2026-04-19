import { readdir, readFile } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import matter from 'gray-matter';
import Fuse from 'fuse.js';
import { KB_ROOT, KB_DIRS, URI_SCHEME } from './constants.js';

export interface KBDocument {
  slug: string;       // e.g. "projects/audio-forge"
  uri: string;        // e.g. "brain://projects/audio-forge"
  title: string;      // from frontmatter or first H1, or filename
  content: string;    // full raw markdown (with frontmatter stripped)
  raw: string;        // original file contents including frontmatter
}

let _docs: KBDocument[] = [];
let _searchIndex: Fuse<KBDocument> | null = null;

/** Extract a human-readable title from markdown content or filename */
function extractTitle(content: string, fallback: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : fallback;
}

/** Walk KB_DIRS and load every .md file */
export async function loadKnowledgeBase(): Promise<void> {
  _docs = [];
  for (const dir of KB_DIRS) {
    const dirPath = join(KB_ROOT, dir);
    let entries: string[];
    try {
      entries = await readdir(dirPath);
    } catch {
      continue; // directory doesn't exist yet — skip
    }
    for (const entry of entries) {
      if (extname(entry) !== '.md') continue;
      const filePath = join(dirPath, entry);
      const raw = await readFile(filePath, 'utf-8');
      const { content, data } = matter(raw);
      const slugBase = basename(entry, '.md');
      const slug = `${dir}/${slugBase}`;
      const title =
        (data.title as string | undefined) ??
        extractTitle(content, slugBase.replace(/-/g, ' '));
      _docs.push({
        slug,
        uri: `${URI_SCHEME}://${slug}`,
        title,
        content,
        raw,
      });
    }
  }
}

export function listDocuments(): Pick<KBDocument, 'slug' | 'uri' | 'title'>[] {
  return _docs.map(({ slug, uri, title }) => ({ slug, uri, title }));
}

export function getDocumentByUri(uri: string): KBDocument | undefined {
  return _docs.find((d) => d.uri === uri);
}

export function getDocumentBySlug(slug: string): KBDocument | undefined {
  return _docs.find((d) => d.slug === slug);
}

export function getAllDocuments(): KBDocument[] {
  return _docs;
}

/**
 * Set the search index reference (called by buildSearchIndex in search.ts)
 * Internal use only
 */
export function setSearchIndex(index: Fuse<KBDocument> | null): void {
  _searchIndex = index;
}

/**
 * Reload a single document from disk and update the index
 * Used when a document is created, updated, or appended
 */
export async function reloadDocument(slug: string): Promise<void> {
  const parts = slug.split('/');
  if (parts.length < 2) {
    throw new Error('Invalid slug format');
  }

  const dir = parts[0];
  const fileName = `${parts.slice(1).join('/')}.md`;
  const filePath = join(KB_ROOT, dir, fileName);

  try {
    const raw = await readFile(filePath, 'utf-8');
    const { content, data } = matter(raw);
    const slugBase = basename(fileName, '.md');
    const title =
      (data.title as string | undefined) ??
      extractTitle(content, slugBase.replace(/-/g, ' '));

    const newDoc: KBDocument = {
      slug,
      uri: `${URI_SCHEME}://${slug}`,
      title,
      content,
      raw,
    };

    // Find and update existing doc, or add new one
    const existingIdx = _docs.findIndex((d) => d.slug === slug);
    if (existingIdx >= 0) {
      _docs[existingIdx] = newDoc;
    } else {
      _docs.push(newDoc);
    }

    // Rebuild search index if it exists
    if (_searchIndex) {
      rebuildSearchIndex();
    }
  } catch (err) {
    throw new Error(
      `Failed to reload document "${slug}": ${(err as Error).message}`
    );
  }
}

/**
 * Remove a document from the in-memory cache and search index
 * Used when a document is deleted
 */
export function removeFromIndex(slug: string): void {
  const existingIdx = _docs.findIndex((d) => d.slug === slug);
  if (existingIdx >= 0) {
    _docs.splice(existingIdx, 1);
  }

  // Rebuild search index if it exists
  if (_searchIndex) {
    rebuildSearchIndex();
  }
}

/**
 * Rebuild the search index from current _docs
 * Internal helper function
 */
function rebuildSearchIndex(): void {
  if (!_searchIndex) return;

  // Create new Fuse instance with same config
  _searchIndex = new Fuse(_docs, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'content', weight: 1 },
    ],
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 3,
  });
}
