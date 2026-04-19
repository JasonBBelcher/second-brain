import Fuse from 'fuse.js';
import type { KBDocument } from './knowledge-base.js';
import { setSearchIndex } from './knowledge-base.js';

export interface SearchResult {
  slug: string;
  title: string;
  uri: string;
  score: number;
  excerpt: string;
}

let _fuse: Fuse<KBDocument> | null = null;

/** Call once after loadKnowledgeBase() */
export function buildSearchIndex(docs: KBDocument[]): void {
  _fuse = new Fuse(docs, {
    keys: [
      { name: 'title', weight: 2 },
      { name: 'content', weight: 1 },
    ],
    includeScore: true,
    threshold: 0.4,   // 0 = perfect match, 1 = match anything
    ignoreLocation: true,
    minMatchCharLength: 3,
  });
  // Keep reference in knowledge-base.ts for rebuilding when docs change
  setSearchIndex(_fuse);
}

/** Extract a short excerpt around the first match */
function makeExcerpt(content: string, query: string, length = 200): string {
  const idx = content.toLowerCase().indexOf(query.toLowerCase().split(' ')[0]);
  const start = Math.max(0, idx - 60);
  const end = Math.min(content.length, start + length);
  const raw = content.slice(start, end).replace(/\n+/g, ' ').trim();
  return (start > 0 ? '...' : '') + raw + (end < content.length ? '...' : '');
}

export function searchDocuments(query: string, limit = 5): SearchResult[] {
  if (!_fuse) return [];
  const results = _fuse.search(query, { limit });
  return results.map(({ item, score }) => ({
    slug: item.slug,
    title: item.title,
    uri: item.uri,
    score: Math.round((1 - (score ?? 1)) * 100) / 100,
    excerpt: makeExcerpt(item.content, query),
  }));
}
