import { readdir, readFile } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import matter from 'gray-matter';
import { KB_ROOT, KB_DIRS, URI_SCHEME } from './constants.js';

export interface KBDocument {
  slug: string;       // e.g. "projects/audio-forge"
  uri: string;        // e.g. "brain://projects/audio-forge"
  title: string;      // from frontmatter or first H1, or filename
  content: string;    // full raw markdown (with frontmatter stripped)
  raw: string;        // original file contents including frontmatter
}

let _docs: KBDocument[] = [];

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
