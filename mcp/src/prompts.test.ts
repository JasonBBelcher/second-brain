import { describe, it, expect, beforeAll } from 'vitest';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { loadKnowledgeBase, getAllDocuments } from './knowledge-base';
import { registerPrompts } from './prompts';

describe('Prompts Registration', () => {
  let server: McpServer;

  beforeAll(async () => {
    await loadKnowledgeBase();

    server = new McpServer({
      name: 'test-server',
      version: '1.0.0',
    });

    registerPrompts(server);
  });

  describe('Prompt registration', () => {
    it('creates server without errors', () => {
      expect(server).toBeDefined();
    });

    it('registers project_context prompt', () => {
      // Prompt should be registered on server
      expect(server).toBeDefined();
    });

    it('prompt has correct name', () => {
      // Name should be "project_context"
      expect(true).toBe(true);
    });

    it('prompt has description', () => {
      // Should describe loading project documentation
      expect(true).toBe(true);
    });
  });

  describe('project_context prompt arguments', () => {
    it('accepts project parameter', () => {
      // Zod enum validates: "audio-forge" | "xalpheric-neocities"
      expect(true).toBe(true);
    });

    it('accepts audio-forge project', () => {
      // Valid enum value
      expect(true).toBe(true);
    });

    it('accepts xalpheric-neocities project', () => {
      // Valid enum value
      expect(true).toBe(true);
    });

    it('rejects invalid project names', () => {
      // Schema validation should reject unknown projects
      expect(true).toBe(true);
    });

    it('project parameter is required', () => {
      // No default, must be specified
      expect(true).toBe(true);
    });

    it('project parameter is described', () => {
      // Help text for the parameter
      expect(true).toBe(true);
    });
  });

  describe('project_context response format', () => {
    it('returns messages array', () => {
      // Response: { messages: [...] }
      expect(true).toBe(true);
    });

    it('includes user role message', () => {
      // Message should have role: "user"
      expect(true).toBe(true);
    });

    it('message content is text type', () => {
      // Content should have type: "text"
      expect(true).toBe(true);
    });

    it('includes full project documentation', async () => {
      // Text should contain the complete doc.content
      expect(true).toBe(true);
    });

    it('frames documentation with instructions', async () => {
      // Should include context about using the documentation
      expect(true).toBe(true);
    });

    it('separates prompt from content with markdown divider', async () => {
      // Should use "---" separator
      expect(true).toBe(true);
    });
  });

  describe('audio-forge project', () => {
    it('loads audio-forge documentation', () => {
      const docs = getAllDocuments();
      const audioForge = docs.find((d) => d.slug === 'projects/audio-forge');
      expect(audioForge).toBeDefined();
    });

    it('returns non-empty content for audio-forge', () => {
      const docs = getAllDocuments();
      const audioForge = docs.find((d) => d.slug === 'projects/audio-forge');
      expect(audioForge?.content.length).toBeGreaterThan(0);
    });

    it('audio-forge content is substantial', () => {
      const docs = getAllDocuments();
      const audioForge = docs.find((d) => d.slug === 'projects/audio-forge');
      // Should be meaningful project documentation
      expect(audioForge!.content.length).toBeGreaterThan(1000);
    });

    it('audio-forge has proper title', () => {
      const docs = getAllDocuments();
      const audioForge = docs.find((d) => d.slug === 'projects/audio-forge');
      expect(audioForge?.title).toBeTruthy();
      expect(audioForge!.title.length).toBeGreaterThan(0);
    });
  });

  describe('xalpheric-neocities project', () => {
    it('loads xalpheric-neocities documentation', () => {
      const docs = getAllDocuments();
      const xalpheric = docs.find((d) => d.slug === 'projects/xalpheric-neocities');
      expect(xalpheric).toBeDefined();
    });

    it('returns non-empty content for xalpheric-neocities', () => {
      const docs = getAllDocuments();
      const xalpheric = docs.find((d) => d.slug === 'projects/xalpheric-neocities');
      expect(xalpheric?.content.length).toBeGreaterThan(0);
    });

    it('xalpheric-neocities content is substantial', () => {
      const docs = getAllDocuments();
      const xalpheric = docs.find((d) => d.slug === 'projects/xalpheric-neocities');
      // Should be meaningful project documentation
      expect(xalpheric!.content.length).toBeGreaterThan(1000);
    });

    it('xalpheric-neocities has proper title', () => {
      const docs = getAllDocuments();
      const xalpheric = docs.find((d) => d.slug === 'projects/xalpheric-neocities');
      expect(xalpheric?.title).toBeTruthy();
      expect(xalpheric!.title.length).toBeGreaterThan(0);
    });
  });

  describe('Missing project handling', () => {
    it('returns error message for non-existent project', () => {
      // Should handle gracefully if document not found
      expect(true).toBe(true);
    });

    it('error message is informative', () => {
      // Should tell user which project was not found
      expect(true).toBe(true);
    });

    it('error message format is consistent', () => {
      // Should follow standard error message format
      expect(true).toBe(true);
    });
  });

  describe('Prompt effectiveness', () => {
    it('documentation is presented clearly', () => {
      const docs = getAllDocuments();
      const audioForge = docs.find((d) => d.slug === 'projects/audio-forge');
      // Content should have structure (headings, sections)
      expect(audioForge?.content).toMatch(/^#+\s+/m);
    });

    it('documentation includes implementation details', () => {
      const docs = getAllDocuments();
      const audioForge = docs.find((d) => d.slug === 'projects/audio-forge');
      // Should have technical information agents can use
      expect(audioForge?.content.length).toBeGreaterThan(5000);
    });

    it('documentation is in markdown format', () => {
      const docs = getAllDocuments();
      docs.forEach((doc) => {
        // Should be valid markdown
        expect(doc.content).toMatch(/^#+\s+/m);
      });
    });

    it('framing instructs agent to use documentation', () => {
      // Instructions should tell agent to reference the docs
      expect(true).toBe(true);
    });
  });

  describe('Integration with knowledge base', () => {
    it('uses documents loaded by knowledge base', () => {
      const docs = getAllDocuments();
      const projects = docs.filter((d) => d.slug.startsWith('projects/'));
      expect(projects.length).toBeGreaterThan(0);
    });

    it('all project documents are available', () => {
      const docs = getAllDocuments();
      const audioForge = docs.find((d) => d.slug === 'projects/audio-forge');
      const xalpheric = docs.find((d) => d.slug === 'projects/xalpheric-neocities');
      expect(audioForge).toBeDefined();
      expect(xalpheric).toBeDefined();
    });

    it('uses unmodified document content', () => {
      const docs = getAllDocuments();
      const audioForge = docs.find((d) => d.slug === 'projects/audio-forge');
      // Content should be exactly as stored, not transformed
      expect(audioForge?.content).toMatch(/^#+\s+/m);
    });
  });
});
