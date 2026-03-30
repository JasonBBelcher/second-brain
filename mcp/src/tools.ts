import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { searchDocuments } from './search.js';
import { getDocumentBySlug } from './knowledge-base.js';

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
}
