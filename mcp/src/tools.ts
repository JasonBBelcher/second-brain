import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchDocuments } from './search.js';
import { getDocumentBySlug, reloadDocument, removeFromIndex } from './knowledge-base.js';
import {
  createDocument,
  updateDocument,
  appendToDocument,
  deleteDocument,
} from './write.js';

export function registerTools(server: McpServer): void {
  // ── search_brain ───────────────────────────────────────────────
  server.tool(
    'search_brain',
    'Fuzzy-search across all second-brain documents. Returns matching excerpts with title and relevance score.',
    {
      query: z.string().min(2).max(200).describe('What to search for'),
      limit: z.number().int().min(1).max(10).optional().default(5)
        .describe('Maximum number of results (default 5)'),
    },
    async ({ query, limit }) => {
      const results = searchDocuments(query, limit);
      if (results.length === 0) {
        return { content: [{ type: 'text', text: `No results found for: "${query}"` }] };
      }
      const formatted = results
        .map((r, i) =>
          `[${i + 1}] ${r.title} (${r.slug}) — score: ${r.score}\n    "${r.excerpt}"`
        )
        .join('\n\n');
      return { content: [{ type: 'text', text: formatted }] };
    }
  );

  // ── get_document ───────────────────────────────────────────────
  server.tool(
    'get_document',
    'Fetch the complete markdown contents of a second-brain document by its slug.',
    {
      slug: z.string().min(1).describe('Document slug, e.g. "projects/audio-forge"'),
    },
    async ({ slug }) => {
      const doc = getDocumentBySlug(slug);
      if (!doc) {
        return {
          content: [{ type: 'text', text: `Document not found: "${slug}"` }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: doc.content }] };
    }
  );

  // ── create_document ────────────────────────────────────────────
  server.tool(
    'create_document',
    'Create a new document in the second-brain knowledge base.',
    {
      slug: z
        .string()
        .min(1)
        .describe('Document path key, e.g. "projects/my-note"'),
      title: z.string().min(1).describe('Document title'),
      content: z.string().min(1).describe('Markdown body content (without frontmatter)'),
      frontmatter: z.record(z.unknown()).optional().describe('Extra YAML frontmatter fields'),
    },
    async ({ slug, title, content, frontmatter }) => {
      try {
        await createDocument(slug, title, content, frontmatter);
        await reloadDocument(slug);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully created document: "${slug}" (${title})`,
            },
          ],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: (err as Error).message }],
          isError: true,
        };
      }
    }
  );

  // ── update_document ────────────────────────────────────────────
  server.tool(
    'update_document',
    'Update an existing document with new markdown content.',
    {
      slug: z
        .string()
        .min(1)
        .describe('Document slug, e.g. "projects/audio-forge"'),
      content: z.string().min(1).describe('New markdown body content'),
      frontmatter: z
        .record(z.unknown())
        .optional()
        .describe('Frontmatter fields to merge/update'),
    },
    async ({ slug, content, frontmatter }) => {
      try {
        await updateDocument(slug, content, frontmatter);
        await reloadDocument(slug);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully updated document: "${slug}"`,
            },
          ],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: (err as Error).message }],
          isError: true,
        };
      }
    }
  );

  // ── append_to_document ─────────────────────────────────────────
  server.tool(
    'append_to_document',
    'Append markdown content to the end of an existing document.',
    {
      slug: z
        .string()
        .min(1)
        .describe('Document slug, e.g. "projects/audio-forge"'),
      content: z.string().min(1).describe('Markdown content to append'),
    },
    async ({ slug, content }) => {
      try {
        await appendToDocument(slug, content);
        await reloadDocument(slug);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully appended to document: "${slug}"`,
            },
          ],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: (err as Error).message }],
          isError: true,
        };
      }
    }
  );

  // ── delete_document ────────────────────────────────────────────
  server.tool(
    'delete_document',
    'Delete a document from the second-brain knowledge base.',
    {
      slug: z
        .string()
        .min(1)
        .describe('Document slug, e.g. "projects/audio-forge"'),
    },
    async ({ slug }) => {
      try {
        await deleteDocument(slug);
        removeFromIndex(slug);
        return {
          content: [
            {
              type: 'text',
              text: `Successfully deleted document: "${slug}"`,
            },
          ],
          isError: false,
        };
      } catch (err) {
        return {
          content: [{ type: 'text', text: (err as Error).message }],
          isError: true,
        };
      }
    }
  );
}
