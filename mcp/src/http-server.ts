import http from 'http';
import { loadKnowledgeBase, getAllDocuments, getDocumentBySlug } from './knowledge-base.js';
import { buildSearchIndex, searchDocuments } from './search.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY; // Required for authentication

// Middleware to check API key (except /health)
function requireApiKey(pathname: string, req: http.IncomingMessage): boolean {
  // Allow /health without authentication
  if (pathname === '/health') {
    return true;
  }

  // If no API_KEY env var set, allow all (development mode)
  if (!API_KEY) {
    process.stderr.write(
      '⚠️  WARNING: API_KEY not set. Running in development mode (no authentication).\n'
    );
    return true;
  }

  // Check Authorization header or ?key= query param
  const authHeader = req.headers.authorization || '';
  const keyFromHeader = authHeader.replace(/^Bearer\s+/i, '').trim();
  const keyFromQuery = new URL(req.url || '', `http://${req.headers.host}`).searchParams.get('key');

  return keyFromHeader === API_KEY || keyFromQuery === API_KEY;
}

async function main() {
  // Load and index knowledge base
  await loadKnowledgeBase();
  buildSearchIndex(getAllDocuments());

  const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Check authentication on all endpoints except /health
    if (!requireApiKey(pathname, req)) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'unauthorized', message: 'API key required' }));
      return;
    }

    // GET /health
    if (pathname === '/health' && req.method === 'GET') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', version: SERVER_VERSION }));
      return;
    }

    // GET /documents
    if (pathname === '/documents' && req.method === 'GET') {
      const docs = getAllDocuments().map((d) => ({
        slug: d.slug,
        uri: d.uri,
        title: d.title,
      }));
      res.writeHead(200);
      res.end(JSON.stringify(docs));
      return;
    }

    // GET /search?query=...&limit=...
    if (pathname === '/search' && req.method === 'GET') {
      const query = url.searchParams.get('query') || '';
      const limitStr = url.searchParams.get('limit') || '5';
      const limit = Math.min(10, Math.max(1, parseInt(limitStr, 10)));

      if (!query || query.length < 2) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'query required (min 2 chars)' }));
        return;
      }

      const results = searchDocuments(query, limit);
      res.writeHead(200);
      res.end(JSON.stringify(results));
      return;
    }

    // POST /search (JSON body)
    if (pathname === '/search' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const { query, limit } = JSON.parse(body);
          if (!query || query.length < 2) {
            res.writeHead(400);
            res.end(JSON.stringify({ error: 'query required (min 2 chars)' }));
            return;
          }
          const results = searchDocuments(query, Math.min(10, limit || 5));
          res.writeHead(200);
          res.end(JSON.stringify(results));
        } catch (err) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'invalid JSON' }));
        }
      });
      return;
    }

    // GET /document/:slug
    if (pathname.startsWith('/document/') && req.method === 'GET') {
      const slug = pathname.slice(10); // Remove "/document/"
      const doc = getDocumentBySlug(slug);
      if (!doc) {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'document not found' }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify({ slug: doc.slug, title: doc.title, content: doc.content }));
      return;
    }

    // Root — API info
    if ((pathname === '/' || pathname === '') && req.method === 'GET') {
      res.writeHead(200);
      res.end(
        JSON.stringify({
          name: SERVER_NAME,
          version: SERVER_VERSION,
          endpoints: {
            'GET /health': 'Server status',
            'GET /documents': 'List all documents',
            'GET /search?query=...&limit=...': 'Search documents',
            'POST /search': 'Search with JSON body {query, limit}',
            'GET /document/:slug': 'Get document by slug',
          },
        })
      );
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not found' }));
  });

  server.listen(PORT, () => {
    process.stderr.write(`${SERVER_NAME} v${SERVER_VERSION} HTTP server listening on port ${PORT}\n`);
  });
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
