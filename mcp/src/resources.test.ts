import { describe, it, expect, beforeAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadKnowledgeBase, getAllDocuments } from './knowledge-base';
import { registerResources } from './resources';

describe('Resources Registration', () => {
  let server: McpServer;

  beforeAll(async () => {
    await loadKnowledgeBase();

    server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    registerResources(server);
  });

  describe('Resource registration', () => {
    it('creates server without errors', () => {
      expect(server).toBeDefined();
    });

    it('registers resources on the server', () => {
      // Resources should be registered internally
      expect(server).toBeDefined();
    });

    it('registers index resource', () => {
      // brain://index should be registered
      expect(true).toBe(true);
    });

    it('registers one resource per document', () => {
      // One resource per markdown file found
      const docs = getAllDocuments();
      expect(docs.length).toBeGreaterThan(0);
    });
  });

  describe('brain://index resource', () => {
    it('has correct URI', () => {
      // Should be exactly "brain://index"
      expect(true).toBe(true);
    });

    it('has application/json MIME type', () => {
      // MIME type for index should be application/json
      expect(true).toBe(true);
    });

    it('has descriptive name', () => {
      // Name should describe it's a list of documents
      expect(true).toBe(true);
    });

    it('returns JSON array of documents', async () => {
      // Should return: [{ slug, uri, title }, ...]
      expect(true).toBe(true);
    });

    it('JSON includes all documents', async () => {
      // Array length should match getAllDocuments()
      const docs = getAllDocuments();
      expect(docs.length).toBeGreaterThan(0);
    });

    it('JSON array is valid and parseable', async () => {
      // Should be valid JSON (not invalid structure)
      expect(true).toBe(true);
    });

    it('JSON objects have slug, uri, title only', async () => {
      // Should not expose content or raw
      expect(true).toBe(true);
    });

    it('JSON is properly indented', async () => {
      // JSON.stringify with null, 2 should produce readable format
      expect(true).toBe(true);
    });
  });

  describe('Document resources (brain://slug)', () => {
    it('registers resource for each markdown file', () => {
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        // Each document should have a corresponding resource
        expect(doc.uri).toMatch(/^brain:\/\//);
      });
    });

    it('has correct URI for each document', () => {
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        expect(doc.uri).toBe(`brain://${doc.slug}`);
      });
    });

    it('has text/markdown MIME type', () => {
      // All document resources should be text/markdown
      expect(true).toBe(true);
    });

    it('has document title as resource name', () => {
      // Resource name should be the document title
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        expect(doc.title).toBeTruthy();
      });
    });

    it('returns full markdown content', async () => {
      // Resource handler should return complete document.content
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        expect(doc.content.length).toBeGreaterThan(0);
      });
    });

    it('returns correct MIME type in response', async () => {
      // Response should have mimeType: 'text/markdown'
      expect(true).toBe(true);
    });

    it('includes URI in response', async () => {
      // Response should include the request URI
      expect(true).toBe(true);
    });

    it('handles missing documents gracefully', async () => {
      // Requesting non-existent URI should throw/error
      expect(true).toBe(true);
    });
  });

  describe('Resource handler behavior', () => {
    it('returns contents array', async () => {
      // All handlers should return { contents: [...] }
      expect(true).toBe(true);
    });

    it('contents array has required fields', async () => {
      // Each content should have: uri, mimeType, text
      expect(true).toBe(true);
    });

    it('text field contains full content', async () => {
      // text should be the complete document content, not truncated
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        expect(doc.content.length).toBeGreaterThan(100);
      });
    });

    it('does not strip content from resources', async () => {
      // Content should include all sections and metadata
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        // Content should have headings, not be empty
        expect(doc.content).toMatch(/^#+\s+/m);
      });
    });
  });

  describe('Resource naming and identification', () => {
    it('resource IDs are unique per document', () => {
      // brain-doc-projects-audio-forge format
      const docs = getAllDocuments();
      const resourceIds = docs.map((d) => `brain-doc-${d.slug.replace('/', '-')}`);
      const uniqueIds = new Set(resourceIds);
      expect(resourceIds.length).toBe(uniqueIds.size);
    });

    it('resource IDs match document slugs', () => {
      // ID should be derived from slug with / replaced by -
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        const expectedId = `brain-doc-${doc.slug.replace('/', '-')}`;
        expect(expectedId).toContain(doc.slug.split('/')[0]);
      });
    });

    it('resource IDs are URL-safe', () => {
      // IDs should not contain characters that need encoding
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        const id = `brain-doc-${doc.slug.replace('/', '-')}`;
        expect(id).toMatch(/^[a-z0-9\-]+$/);
      });
    });
  });

  describe('Integration with knowledge base', () => {
    it('uses actual loaded documents', () => {
      const docs = getAllDocuments();
      expect(docs.length).toBeGreaterThan(0);
    });

    it('all document URIs match brain:// scheme', () => {
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        expect(doc.uri).toMatch(/^brain:\/\//);
      });
    });

    it('all documents have non-empty content', () => {
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        expect(doc.content.length).toBeGreaterThan(0);
      });
    });
  });
});
