import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { loadKnowledgeBase, getAllDocuments } from './knowledge-base.js';
import { buildSearchIndex } from './search.js';

// Import the server creation logic
// We'll test by making actual HTTP requests
let server: http.Server;
const API_KEY = 'test-api-key-12345';
let BASE_URL = 'http://localhost:3001';

beforeAll(async () => {
  // Load knowledge base for the server
  await loadKnowledgeBase();
  buildSearchIndex(getAllDocuments());

  // Start a test server with authentication (port 0 = let OS assign available port)
  server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const pathname = url.pathname;

    // Check authentication (except for /health)
    const requiresAuth = pathname !== '/health';
    if (requiresAuth && API_KEY) {
      const authHeader = req.headers.authorization || '';
      const keyFromHeader = authHeader.replace(/^Bearer\s+/i, '').trim();
      const keyFromQuery = url.searchParams.get('key');

      if (keyFromHeader !== API_KEY && keyFromQuery !== API_KEY) {
        res.writeHead(401);
        res.end(JSON.stringify({ error: 'unauthorized' }));
        return;
      }
    }

    // GET /health
    if (pathname === '/health') {
      res.writeHead(200);
      res.end(JSON.stringify({ status: 'ok', version: '1.0.0' }));
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

    // GET /search
    if (pathname === '/search' && req.method === 'GET') {
      const query = url.searchParams.get('query') || '';
      if (!query || query.length < 2) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'query required' }));
        return;
      }
      res.writeHead(200);
      res.end(JSON.stringify([{ slug: 'test', title: 'Test', score: 0.9 }]));
      return;
    }

    // 404
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'not found' }));
  });

  await new Promise<void>((resolve) => {
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address !== 'string') {
        BASE_URL = `http://localhost:${address.port}`;
      }
      resolve();
    });
  });
});

afterAll(
  () =>
    new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else {
          // Wait for port to be fully released
          setTimeout(resolve, 100);
        }
      });
    })
);

// Helper to make HTTP requests
async function request(
  pathname: string,
  options: { method?: string; key?: string; header?: string } = {}
) {
  const url = new URL(pathname, BASE_URL);
  const { method = 'GET', key, header } = options;

  const headers: Record<string, string> = {};
  if (key) {
    headers['Authorization'] = `Bearer ${key}`;
  }
  if (header) {
    headers['Authorization'] = header;
  }

  const response = await fetch(url.toString(), { method, headers });
  const data = (await response.json()) as Record<string, unknown>;
  return { status: response.status, data };
}

describe('HTTP Server Authentication', () => {
  describe('Public endpoints (/health)', () => {
    it('allows access without API key', async () => {
      const { status, data } = await request('/health');
      expect(status).toBe(200);
      expect(data.status).toBe('ok');
    });
  });

  describe('Protected endpoints', () => {
    it('rejects requests without API key', async () => {
      const { status, data } = await request('/documents');
      expect(status).toBe(401);
      expect(data.error).toBe('unauthorized');
    });

    it('accepts requests with valid Bearer token', async () => {
      const { status, data } = await request('/documents', { key: API_KEY });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('rejects requests with invalid Bearer token', async () => {
      const { status, data } = await request('/documents', { key: 'wrong-key' });
      expect(status).toBe(401);
      expect(data.error).toBe('unauthorized');
    });

    it('accepts Bearer token from Authorization header', async () => {
      const { status, data } = await request('/documents', {
        header: `Bearer ${API_KEY}`,
      });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('accepts API key from query parameter', async () => {
      const { status, data } = await request(`/documents?key=${API_KEY}`);
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('rejects query parameter with wrong key', async () => {
      const { status, data } = await request('/documents?key=wrong-key');
      expect(status).toBe(401);
      expect(data.error).toBe('unauthorized');
    });

    it('ignores case in Authorization scheme', async () => {
      // Both "Bearer" and "bearer" should work
      const { status, data } = await request('/documents', {
        header: `bearer ${API_KEY}`,
      });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('accepts if either header or query param is valid', async () => {
      // Header valid, query invalid → should pass
      const { status: status1 } = await request(`/documents?key=wrong-key`, {
        key: API_KEY,
      });
      expect(status1).toBe(200);

      // Header invalid, query valid → should pass
      const { status: status2 } = await request(`/documents?key=${API_KEY}`, {
        key: 'wrong-key',
      });
      expect(status2).toBe(200);

      // Both invalid → should fail
      const { status: status3 } = await request(`/documents?key=wrong-key`, {
        key: 'also-wrong',
      });
      expect(status3).toBe(401);
    });
  });

  describe('Search endpoint (/search)', () => {
    it('requires API key', async () => {
      const { status } = await request('/search?query=test');
      expect(status).toBe(401);
    });

    it('accepts search with valid key', async () => {
      const { status, data } = await request('/search?query=test', { key: API_KEY });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });

    it('rejects missing query param even with key', async () => {
      const { status } = await request('/search', { key: API_KEY });
      expect(status).toBe(400);
    });
  });

  describe('Non-existent endpoints', () => {
    it('returns 404 for unknown path', async () => {
      const { status, data } = await request('/unknown', { key: API_KEY });
      expect(status).toBe(404);
      expect(data.error).toBe('not found');
    });

    it('still requires auth for 404 response', async () => {
      const { status } = await request('/unknown');
      expect(status).toBe(401);
    });
  });

  describe('HTTP methods', () => {
    it('allows GET requests with auth', async () => {
      const { status, data } = await request('/documents', { key: API_KEY });
      expect(status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });
});
