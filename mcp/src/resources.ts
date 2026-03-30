import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listDocuments, getDocumentByUri } from './knowledge-base.js';
import { URI_SCHEME } from './constants.js';

export function registerResources(server: McpServer): void {
  // ── brain://index ──────────────────────────────────────────────
  server.resource(
    'brain-index',
    `${URI_SCHEME}://index`,
    { mimeType: 'application/json', description: 'List of all knowledge base documents' },
    async () => ({
      contents: [
        {
          uri: `${URI_SCHEME}://index`,
          mimeType: 'application/json',
          text: JSON.stringify(listDocuments(), null, 2),
        },
      ],
    })
  );

  // ── one resource per document ──────────────────────────────────
  for (const doc of listDocuments()) {
    server.resource(
      `brain-doc-${doc.slug.replace('/', '-')}`,
      doc.uri,
      { mimeType: 'text/markdown', description: doc.title },
      async (uri) => {
        const found = getDocumentByUri(uri.href);
        if (!found) throw new Error(`Document not found: ${uri.href}`);
        return {
          contents: [{ uri: uri.href, mimeType: 'text/markdown', text: found.content }],
        };
      }
    );
  }
}
