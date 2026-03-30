import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadKnowledgeBase,
  getAllDocuments,
  getDocumentBySlug,
  getDocumentByUri,
  listDocuments,
} from './knowledge-base';

describe('Knowledge Base', () => {
  beforeAll(async () => {
    await loadKnowledgeBase();
  });

  describe('loadKnowledgeBase', () => {
    it('loads all available documents', async () => {
      const docs = getAllDocuments();
      expect(docs.length).toBeGreaterThan(0);
    });

    it('loads markdown files from configured directories', async () => {
      const docs = getAllDocuments();
      const slugs = docs.map((d) => d.slug);
      expect(slugs).toContain('projects/audio-forge');
      expect(slugs).toContain('projects/xalpheric-neocities');
      expect(slugs).toContain('preferences/coding-style');
    });
  });

  describe('KBDocument structure', () => {
    it('includes required fields', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      expect(doc).toBeDefined();
      expect(doc).toHaveProperty('slug');
      expect(doc).toHaveProperty('uri');
      expect(doc).toHaveProperty('title');
      expect(doc).toHaveProperty('content');
      expect(doc).toHaveProperty('raw');
    });

    it('has proper slug format', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      expect(doc?.slug).toBe('projects/audio-forge');
    });

    it('has proper URI format', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      expect(doc?.uri).toBe('brain://projects/audio-forge');
    });

    it('has non-empty title', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      expect(doc?.title).toBeTruthy();
      expect(doc!.title.length).toBeGreaterThan(0);
    });

    it('has non-empty content (frontmatter stripped)', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      expect(doc?.content).toBeTruthy();
      expect(doc!.content.length).toBeGreaterThan(0);
    });

    it('content does not contain frontmatter markers', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      const lines = doc!.content.split('\n');
      // First line should not be "---"
      expect(lines[0]).not.toBe('---');
    });

    it('raw includes frontmatter', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      expect(doc?.raw.length).toBeGreaterThanOrEqual(doc!.content.length);
    });
  });

  describe('getDocumentBySlug', () => {
    it('finds document by exact slug', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      expect(doc).toBeDefined();
      expect(doc?.slug).toBe('projects/audio-forge');
    });

    it('returns undefined for non-existent slug', () => {
      const doc = getDocumentBySlug('projects/nonexistent');
      expect(doc).toBeUndefined();
    });

    it('returns undefined for wrong directory', () => {
      const doc = getDocumentBySlug('invalid/audio-forge');
      expect(doc).toBeUndefined();
    });

    it('is case-sensitive', () => {
      const doc = getDocumentBySlug('Projects/Audio-Forge');
      expect(doc).toBeUndefined();
    });
  });

  describe('getDocumentByUri', () => {
    it('finds document by exact URI', () => {
      const doc = getDocumentByUri('brain://projects/audio-forge');
      expect(doc).toBeDefined();
      expect(doc?.uri).toBe('brain://projects/audio-forge');
    });

    it('returns undefined for non-existent URI', () => {
      const doc = getDocumentByUri('brain://projects/nonexistent');
      expect(doc).toBeUndefined();
    });

    it('returns undefined for wrong scheme', () => {
      const doc = getDocumentByUri('https://projects/audio-forge');
      expect(doc).toBeUndefined();
    });

    it('matches by URI slug correctly', () => {
      const doc = getDocumentByUri('brain://projects/audio-forge');
      expect(doc?.slug).toBe('projects/audio-forge');
    });
  });

  describe('listDocuments', () => {
    it('returns array of all documents', () => {
      const docs = listDocuments();
      expect(Array.isArray(docs)).toBe(true);
      expect(docs.length).toBeGreaterThan(0);
    });

    it('includes only slug, uri, title fields', () => {
      const docs = listDocuments();
      const doc = docs[0];
      expect(Object.keys(doc)).toEqual(['slug', 'uri', 'title']);
    });

    it('does not expose raw or content', () => {
      const docs = listDocuments();
      docs.forEach((doc) => {
        expect(doc).not.toHaveProperty('content');
        expect(doc).not.toHaveProperty('raw');
      });
    });

    it('returns same count as getAllDocuments', () => {
      const listed = listDocuments();
      const all = getAllDocuments();
      expect(listed.length).toBe(all.length);
    });
  });

  describe('getAllDocuments', () => {
    it('returns full document objects with all fields', () => {
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        expect(doc).toHaveProperty('slug');
        expect(doc).toHaveProperty('uri');
        expect(doc).toHaveProperty('title');
        expect(doc).toHaveProperty('content');
        expect(doc).toHaveProperty('raw');
      });
    });

    it('content is valid markdown', () => {
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        // Markdown should have at least a heading
        expect(doc.content).toMatch(/^#+\s+/m);
      });
    });
  });

  describe('Title extraction', () => {
    it('extracts title from H1 heading', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      expect(doc?.title).toBeTruthy();
      // Should be a meaningful title, not a slug replacement
      expect(doc!.title).not.toMatch(/^audio-forge$/i);
    });

    it('extracts title from frontmatter if present', () => {
      const doc = getDocumentBySlug('preferences/coding-style');
      expect(doc?.title).toBe('Coding Style & Workflow Preferences');
    });

    it('uses slug replacement as fallback', () => {
      const doc = getDocumentBySlug('projects/audio-forge');
      // Either from H1 or frontmatter, should not be raw slug
      expect(doc?.title).not.toBe('audio-forge');
    });
  });

  describe('Multiple document types', () => {
    it('loads projects documents', () => {
      const docs = getAllDocuments();
      const projects = docs.filter((d) => d.slug.startsWith('projects/'));
      expect(projects.length).toBeGreaterThan(0);
    });

    it('loads preference documents', () => {
      const docs = getAllDocuments();
      const prefs = docs.filter((d) => d.slug.startsWith('preferences/'));
      expect(prefs.length).toBeGreaterThan(0);
    });

    it('each document has unique slug', () => {
      const docs = getAllDocuments();
      const slugs = docs.map((d) => d.slug);
      const uniqueSlugs = new Set(slugs);
      expect(slugs.length).toBe(uniqueSlugs.size);
    });

    it('each document has unique URI', () => {
      const docs = getAllDocuments();
      const uris = docs.map((d) => d.uri);
      const uniqueUris = new Set(uris);
      expect(uris.length).toBe(uniqueUris.size);
    });
  });
});
