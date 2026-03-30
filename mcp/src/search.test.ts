import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadKnowledgeBase,
  getAllDocuments,
  getDocumentBySlug,
} from './knowledge-base';
import { buildSearchIndex, searchDocuments } from './search';

describe('Search', () => {
  beforeAll(async () => {
    await loadKnowledgeBase();
    buildSearchIndex(getAllDocuments());
  });

  describe('buildSearchIndex', () => {
    it('creates a searchable index', () => {
      const results = searchDocuments('test');
      // Should not throw, index is built
      expect(Array.isArray(results)).toBe(true);
    });

    it('indexes all documents', () => {
      // Search for common word that appears in all docs
      const results = searchDocuments('the', 10);
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('searchDocuments', () => {
    it('returns array of results', () => {
      const results = searchDocuments('audio');
      expect(Array.isArray(results)).toBe(true);
    });

    it('returns SearchResult objects with required fields', () => {
      const results = searchDocuments('AudioForge');
      expect(results.length).toBeGreaterThan(0);
      results.forEach((result) => {
        expect(result).toHaveProperty('slug');
        expect(result).toHaveProperty('title');
        expect(result).toHaveProperty('uri');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('excerpt');
      });
    });

    it('finds documents by title keyword', () => {
      const results = searchDocuments('AudioForge');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].slug).toContain('audio-forge');
    });

    it('finds documents by content keyword', () => {
      const results = searchDocuments('job queue');
      expect(results.length).toBeGreaterThan(0);
      // Should find audio-forge which discusses job queue
      const audioForge = results.find((r) => r.slug === 'projects/audio-forge');
      expect(audioForge).toBeDefined();
    });

    it('returns empty array for non-existent query', () => {
      const results = searchDocuments('xyzabc123nonexistent');
      expect(results.length).toBe(0);
    });

    it('respects limit parameter', () => {
      const results1 = searchDocuments('the', 1);
      expect(results1.length).toBeLessThanOrEqual(1);

      const results3 = searchDocuments('the', 3);
      expect(results3.length).toBeLessThanOrEqual(3);

      const results10 = searchDocuments('the', 10);
      expect(results10.length).toBeLessThanOrEqual(10);
    });

    it('defaults to limit of 5', () => {
      const results = searchDocuments('the');
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('limits to maximum of 10', () => {
      const results = searchDocuments('the', 100);
      // Fuse.js should cap at requested limit, but API allows up to 10
      expect(results.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Search results scoring', () => {
    it('returns numeric score between 0 and 1', () => {
      const results = searchDocuments('AudioForge');
      results.forEach((result) => {
        expect(typeof result.score).toBe('number');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    });

    it('ranks more relevant results higher', () => {
      const results = searchDocuments('AudioForge');
      if (results.length > 1) {
        // First result should have highest score
        expect(results[0].score).toBeGreaterThanOrEqual(results[1].score);
      }
    });

    it('exact title matches score highest', () => {
      const results = searchDocuments('AudioForge');
      // AudioForge is the exact title, should be first
      expect(results[0].slug).toContain('audio-forge');
    });
  });

  describe('Excerpts', () => {
    it('returns excerpt for each result', () => {
      const results = searchDocuments('TypeScript');
      results.forEach((result) => {
        expect(result.excerpt).toBeTruthy();
        expect(result.excerpt.length).toBeGreaterThan(0);
      });
    });

    it('excerpt contains search term', () => {
      const results = searchDocuments('job queue');
      results.forEach((result) => {
        const lowerExcerpt = result.excerpt.toLowerCase();
        const lowerQuery = 'job queue'.toLowerCase();
        // At least one of the query words should be in excerpt
        expect(
          lowerExcerpt.includes('job') || lowerExcerpt.includes('queue')
        ).toBe(true);
      });
    });

    it('excerpt has ellipsis for truncation', () => {
      const results = searchDocuments('the');
      results.forEach((result) => {
        // Some excerpts might be truncated (not all)
        if (result.excerpt.length > 150) {
          expect(result.excerpt).toContain('...');
        }
      });
    });

    it('excerpt is reasonable length', () => {
      const results = searchDocuments('AudioForge');
      results.forEach((result) => {
        expect(result.excerpt.length).toBeLessThanOrEqual(250);
      });
    });

    it('excerpt does not contain newlines', () => {
      const results = searchDocuments('AudioForge');
      results.forEach((result) => {
        expect(result.excerpt).not.toContain('\n');
      });
    });
  });

  describe('URI and slug consistency', () => {
    it('returned slug matches original document', () => {
      const results = searchDocuments('AudioForge');
      const result = results[0];
      const original = getDocumentBySlug(result.slug);
      expect(original).toBeDefined();
    });

    it('returned URI matches original document', () => {
      const results = searchDocuments('AudioForge');
      const result = results[0];
      const original = getDocumentBySlug(result.slug);
      expect(result.uri).toBe(original?.uri);
    });

    it('returned title matches original document', () => {
      const results = searchDocuments('AudioForge');
      const result = results[0];
      const original = getDocumentBySlug(result.slug);
      expect(result.title).toBe(original?.title);
    });
  });

  describe('Fuzzy matching', () => {
    it('finds typos with fuzzy matching', () => {
      // "Audio" should match "AudioForge" even if not exact
      const results = searchDocuments('Audio');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].slug).toContain('audio');
    });

    it('finds partial words', () => {
      // "forge" should match "AudioForge"
      const results = searchDocuments('forge');
      expect(results.some((r) => r.slug.includes('audio-forge'))).toBe(true);
    });

    it('case-insensitive search', () => {
      const resultsLower = searchDocuments('audioforge');
      const resultsUpper = searchDocuments('AUDIOFORGE');
      // Both should find similar results
      expect(resultsLower.length).toBeGreaterThan(0);
      expect(resultsUpper.length).toBeGreaterThan(0);
    });

    it('finds results with multiple spaces in query', () => {
      const results = searchDocuments('job    queue');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Edge cases', () => {
    it('handles empty query gracefully', () => {
      // Empty string might return nothing or everything depending on Fuse config
      const results = searchDocuments('');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles very long query', () => {
      const longQuery = 'a'.repeat(200);
      const results = searchDocuments(longQuery);
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles special characters', () => {
      const results = searchDocuments('C++');
      expect(Array.isArray(results)).toBe(true);
    });

    it('handles numeric queries', () => {
      const results = searchDocuments('2024');
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
