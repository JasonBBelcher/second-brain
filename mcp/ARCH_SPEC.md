# Second Brain MCP Server — Architecture Specification

**Purpose**: Expose the `second-brain` knowledge base to any Claude agent via the Model Context Protocol.
**Transport**: stdio (works with Claude Code and Claude Desktop out of the box)
**Version target**: 1.0.0
**Last updated**: March 2025

---

## Table of Contents

1. [What This Builds](#1-what-this-builds)
2. [Tech Stack Decisions](#2-tech-stack-decisions)
3. [Directory Layout](#3-directory-layout)
4. [MCP API Contract](#4-mcp-api-contract)
5. [Data Flow](#5-data-flow)
6. [Implementation Phases](#6-implementation-phases)
7. [Task Cards (Haiku-sized chunks)](#7-task-cards)
8. [Claude Code Integration](#8-claude-code-integration)
9. [Testing Checklist](#9-testing-checklist)

---

## 1. What This Builds

A **stdio MCP server** that reads the markdown files inside `second-brain/` and exposes them to any connected AI agent through:

| Primitive | Name | Description |
|-----------|------|-------------|
| Resource | `brain://projects/audio-forge` | Full text of `projects/audio-forge.md` |
| Resource | `brain://projects/xalpheric-neocities` | Full text of `projects/xalpheric-neocities.md` |
| Resource | `brain://preferences/coding-style` | Full text of `preferences/coding-style.md` |
| Resource | `brain://index` | Listing of all available documents |
| Tool | `search_brain` | Fuzzy-search across all documents by query string |
| Tool | `get_document` | Fetch a single document by its slug |
| Prompt | `project_context` | Inject full project context for a named project |

This lets any agent — Claude Code, Claude Desktop, API clients — ask things like:
- "What is the AudioForge job queue system?"
- "Show me the xalpheric drum machine implementation"
- "What are Jason's coding preferences?"

---

## 2. Tech Stack Decisions

### Why these and not alternatives

| Choice | Package | Reason |
|--------|---------|--------|
| **MCP framework** | `@modelcontextprotocol/sdk` | Official SDK, stdio support built-in, actively maintained |
| **Schema validation** | `zod` | Required peer dep of SDK, great error messages |
| **Fuzzy search** | `fuse.js` | Zero-config, in-memory, no native binaries — perfect for <20 files |
| **Frontmatter parsing** | `gray-matter` | Reliable YAML/TOML frontmatter extraction from markdown |
| **TS runner (dev)** | `tsx` | Run `.ts` files directly, no build step needed in development |
| **Type checking** | `typescript` | Strict types throughout |

### Why NOT the heavy alternatives

- **LanceDB / FAISS** — Vector databases are overkill for a handful of markdown files. Fuse.js gives good-enough fuzzy search with zero setup.
- **Streamable HTTP transport** — Adds complexity (auth, CORS, ports). stdio works natively with Claude Code and Claude Desktop without any config.
- **Express / Fastify** — Not needed. The MCP SDK handles the protocol layer entirely over stdio.

---

## 3. Directory Layout

```
second-brain/
├── mcp/                          ← Everything for the MCP server lives here
│   ├── ARCH_SPEC.md              ← This file
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── index.ts              ← Entry point: creates server, starts stdio
│   │   ├── constants.ts          ← KB_ROOT path, server name/version
│   │   ├── knowledge-base.ts     ← Load, parse, and index markdown files
│   │   ├── search.ts             ← Fuse.js wrapper
│   │   ├── resources.ts          ← Register MCP resources
│   │   ├── tools.ts              ← Register MCP tools
│   │   └── prompts.ts            ← Register MCP prompts
│   └── README.md                 ← How to run and configure
│
├── projects/
│   ├── audio-forge.md
│   └── xalpheric-neocities.md
├── preferences/
│   └── coding-style.md
└── README.md
```

---

## 4. MCP API Contract

### Resources

Resources are **read-only** and surfaced to the user/agent explicitly.

#### `brain://index`
```
uri:      brain://index
name:     Knowledge Base Index
mimeType: application/json
```
Returns a JSON array of all available documents:
```json
[
  { "slug": "projects/audio-forge", "title": "AudioForge", "uri": "brain://projects/audio-forge" },
  { "slug": "projects/xalpheric-neocities", "title": "Xalpheric Neocities", "uri": "brain://projects/xalpheric-neocities" },
  { "slug": "preferences/coding-style", "title": "Coding Style", "uri": "brain://preferences/coding-style" }
]
```

#### `brain://{slug}`
```
uri:      brain://projects/audio-forge   (one per markdown file)
name:     AudioForge — Unified Music Production Platform
mimeType: text/markdown
```
Returns the full raw markdown content of that file.

---

### Tools

Tools are **model-controlled** — the agent decides when to call them.

#### `search_brain`
```
description: Fuzzy-search across all second-brain documents. Returns matching
             excerpts with document title, slug, and relevance score.
             Use this when you need to find specific information without
             knowing which document it lives in.
```
Input schema:
```typescript
{
  query: string,        // what to search for
  limit?: number        // max results, default 5
}
```
Output (text):
```
[1] AudioForge (projects/audio-forge) — score: 0.92
    "...The job queue system persists jobs to SQLite with status:
     pending/running/completed/failed. JobExecutor dispatches to
     registered handlers..."

[2] Coding Style (preferences/coding-style) — score: 0.41
    "...Long-running operations → background job queue..."
```

#### `get_document`
```
description: Fetch the complete contents of a second-brain document by slug.
             Use this when you know exactly which document you need.
```
Input schema:
```typescript
{
  slug: string   // e.g. "projects/audio-forge"
}
```
Output: Full markdown content of the requested file.

---

### Prompts

Prompts are **pre-canned message templates** agents can request.

#### `project_context`
```
description: Returns a system message loaded with the full context for a
             named project. Use at the start of a session to prime the agent.
```
Arguments:
```typescript
{
  project: string   // "audio-forge" | "xalpheric-neocities"
}
```
Returns a `system` message whose text is the full project markdown, framed as:
> "You have access to the following project documentation. Use it to answer questions accurately."

---

## 5. Data Flow

```
Claude Code / Claude Desktop
        │
        │  (spawns process via stdio)
        ▼
  mcp/src/index.ts  ──── StdioServerTransport
        │
        ├── on initialize  →  announce capabilities
        │
        ├── on resources/list  →  knowledge-base.listDocuments()
        │
        ├── on resources/read  →  knowledge-base.getDocument(uri)
        │
        ├── on tools/call "search_brain"  →  search.query(input.query)
        │
        ├── on tools/call "get_document"  →  knowledge-base.getDocument(slug)
        │
        └── on prompts/get "project_context"  →  knowledge-base.getDocument(project)
```

**Startup sequence:**
1. `index.ts` resolves `KB_ROOT` (the `second-brain/` parent directory)
2. `knowledge-base.ts` walks `KB_ROOT`, reads every `.md` file, parses frontmatter
3. `search.ts` builds a Fuse.js index from the loaded documents
4. Resources, tools, and prompts are registered on the `McpServer` instance
5. `StdioServerTransport` connects — server is ready

---

## 6. Implementation Phases

```
Phase 0 — Project Scaffold      (Tasks T0.1–T0.4)   ~15 min
Phase 1 — Knowledge Base Loader (Tasks T1.1–T1.2)   ~20 min
Phase 2 — Search Engine         (Tasks T2.1–T2.2)   ~15 min
Phase 3 — MCP Wiring            (Tasks T3.1–T3.4)   ~30 min
Phase 4 — Integration & Test    (Tasks T4.1–T4.2)   ~15 min
```

Each task is designed to be completable by a small model in a single turn:
- Creates or edits **1–2 files** only
- No file exceeds **80 lines**
- Has explicit success criteria (what to run, what output to expect)

---

## 7. Task Cards

> **How to use these**: Copy the task card prompt into a Claude Haiku session.
> Complete phases in order. Each card is self-contained.

---

### T0.1 — Create `package.json`

**Goal**: Initialize the npm project for the MCP server.

**Create**: `second-brain/mcp/package.json`

**Content to write**:
```json
{
  "name": "second-brain-mcp",
  "version": "1.0.0",
  "description": "MCP server exposing the second-brain knowledge base",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "fuse.js": "^7.0.0",
    "gray-matter": "^4.0.3",
    "zod": "^3.25.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
```

**Then run**: `cd second-brain/mcp && npm install`

**Success**: `node_modules/` created, no errors.

---

### T0.2 — Create `tsconfig.json`

**Goal**: TypeScript config for the MCP server.

**Create**: `second-brain/mcp/tsconfig.json`

**Content to write**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Success**: `cd mcp && npx tsc --noEmit` exits with no errors (once src files exist).

---

### T0.3 — Create `src/constants.ts`

**Goal**: Central place for all hard-coded config (paths, server metadata).

**Create**: `second-brain/mcp/src/constants.ts`

**Content to write**:
```typescript
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Resolve the second-brain root (one level up from mcp/)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const KB_ROOT = resolve(__dirname, '..', '..');

export const SERVER_NAME = 'second-brain-mcp';
export const SERVER_VERSION = '1.0.0';

// Directories within KB_ROOT that contain markdown docs
export const KB_DIRS = ['projects', 'preferences'];

// URI scheme used for resources
export const URI_SCHEME = 'brain';
```

**Success**: File exists, `KB_ROOT` points to the `second-brain/` folder.

---

### T0.4 — Create `src/index.ts` (skeleton only)

**Goal**: Minimal entry point that creates the server and connects stdio.
This will grow as other modules are built — for now it just starts without crashing.

**Create**: `second-brain/mcp/src/index.ts`

**Content to write**:
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

// Resources, tools, and prompts will be registered here in later tasks

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr only — stdout is reserved for MCP protocol messages
  process.stderr.write(`${SERVER_NAME} v${SERVER_VERSION} started\n`);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
```

**Run**: `cd mcp && npm run dev`
**Success**: Prints `second-brain-mcp v1.0.0 started` to stderr, hangs waiting for input (that's correct — it's waiting for the MCP client).
**Stop**: Ctrl+C.

---

### T1.1 — Create `src/knowledge-base.ts`

**Goal**: Load, parse, and expose all markdown files as structured documents.

**Create**: `second-brain/mcp/src/knowledge-base.ts`

```typescript
import { readdir, readFile } from 'fs/promises';
import { join, relative, extname, basename } from 'path';
import matter from 'gray-matter';
import { KB_ROOT, KB_DIRS, URI_SCHEME } from './constants.js';

export interface KBDocument {
  slug: string;       // e.g. "projects/audio-forge"
  uri: string;        // e.g. "brain://projects/audio-forge"
  title: string;      // from frontmatter or first H1, or filename
  content: string;    // full raw markdown (with frontmatter stripped)
  raw: string;        // original file contents including frontmatter
}

let _docs: KBDocument[] = [];

/** Extract a human-readable title from markdown content or filename */
function extractTitle(content: string, fallback: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  return h1 ? h1[1].trim() : fallback;
}

/** Walk KB_DIRS and load every .md file */
export async function loadKnowledgeBase(): Promise<void> {
  _docs = [];
  for (const dir of KB_DIRS) {
    const dirPath = join(KB_ROOT, dir);
    let entries: string[];
    try {
      entries = await readdir(dirPath);
    } catch {
      continue; // directory doesn't exist yet — skip
    }
    for (const entry of entries) {
      if (extname(entry) !== '.md') continue;
      const filePath = join(dirPath, entry);
      const raw = await readFile(filePath, 'utf-8');
      const { content, data } = matter(raw);
      const slugBase = basename(entry, '.md');
      const slug = `${dir}/${slugBase}`;
      const title =
        (data.title as string | undefined) ??
        extractTitle(content, slugBase.replace(/-/g, ' '));
      _docs.push({
        slug,
        uri: `${URI_SCHEME}://${slug}`,
        title,
        content,
        raw,
      });
    }
  }
}

export function listDocuments(): Pick<KBDocument, 'slug' | 'uri' | 'title'>[] {
  return _docs.map(({ slug, uri, title }) => ({ slug, uri, title }));
}

export function getDocumentByUri(uri: string): KBDocument | undefined {
  return _docs.find((d) => d.uri === uri);
}

export function getDocumentBySlug(slug: string): KBDocument | undefined {
  return _docs.find((d) => d.slug === slug);
}

export function getAllDocuments(): KBDocument[] {
  return _docs;
}
```

**Success**: Module exports 4 functions. No TypeScript errors.

---

### T1.2 — Wire knowledge base loading into `index.ts`

**Goal**: Call `loadKnowledgeBase()` before the server connects so docs are ready.

**Edit**: `second-brain/mcp/src/index.ts`

Replace the `main()` function with:
```typescript
async function main() {
  await loadKnowledgeBase();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`${SERVER_NAME} v${SERVER_VERSION} started\n`);
}
```

Add this import at the top of the file:
```typescript
import { loadKnowledgeBase } from './knowledge-base.js';
```

**Run**: `npm run dev`
**Success**: Still starts without errors. Docs are now in memory.

---

### T2.1 — Create `src/search.ts`

**Goal**: Fuse.js-powered fuzzy search across all documents.

**Create**: `second-brain/mcp/src/search.ts`

```typescript
import Fuse from 'fuse.js';
import type { KBDocument } from './knowledge-base.js';

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
  return (_fuse.search(query, { limit }) as Fuse.FuseResult<KBDocument>[]).map(
    ({ item, score }) => ({
      slug: item.slug,
      title: item.title,
      uri: item.uri,
      score: Math.round((1 - (score ?? 1)) * 100) / 100,
      excerpt: makeExcerpt(item.content, query),
    })
  );
}
```

**Success**: No TypeScript errors.

---

### T2.2 — Wire search index into `index.ts`

**Goal**: Build the search index right after loading the knowledge base.

**Edit**: `second-brain/mcp/src/index.ts`

Add import:
```typescript
import { buildSearchIndex, getAllDocuments } from './knowledge-base.js';
import { buildSearchIndex as buildIndex } from './search.js';
```

Wait — cleaner: keep separate imports:
```typescript
import { loadKnowledgeBase, getAllDocuments } from './knowledge-base.js';
import { buildSearchIndex } from './search.js';
```

Update `main()`:
```typescript
async function main() {
  await loadKnowledgeBase();
  buildSearchIndex(getAllDocuments());

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`${SERVER_NAME} v${SERVER_VERSION} started\n`);
}
```

**Success**: Server starts, no errors.

---

### T3.1 — Create `src/resources.ts`

**Goal**: Register the `brain://index` resource and one resource per markdown file.

**Create**: `second-brain/mcp/src/resources.ts`

```typescript
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
```

**Wire into `index.ts`** — add before `server.connect()`:
```typescript
import { registerResources } from './resources.js';
// ...
registerResources(server);
```

**Success**: No errors.

---

### T3.2 — Create `src/tools.ts`

**Goal**: Register the `search_brain` and `get_document` tools.

**Create**: `second-brain/mcp/src/tools.ts`

```typescript
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
```

**Wire into `index.ts`**:
```typescript
import { registerTools } from './tools.js';
// ...
registerTools(server);
```

**Success**: No TypeScript errors.

---

### T3.3 — Create `src/prompts.ts`

**Goal**: Register the `project_context` prompt template.

**Create**: `second-brain/mcp/src/prompts.ts`

```typescript
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getDocumentBySlug } from './knowledge-base.js';

export function registerPrompts(server: McpServer): void {
  server.prompt(
    'project_context',
    'Load full documentation for a named project into the agent context.',
    {
      project: z
        .enum(['audio-forge', 'xalpheric-neocities'])
        .describe('Which project to load context for'),
    },
    ({ project }) => {
      const doc = getDocumentBySlug(`projects/${project}`);
      if (!doc) {
        return {
          messages: [
            {
              role: 'user',
              content: { type: 'text', text: `Project "${project}" not found in knowledge base.` },
            },
          ],
        };
      }
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You have access to the following project documentation. Use it to answer questions accurately.\n\n---\n\n${doc.content}`,
            },
          },
        ],
      };
    }
  );
}
```

**Wire into `index.ts`**:
```typescript
import { registerPrompts } from './prompts.js';
// ...
registerPrompts(server);
```

**Success**: No errors. All three registration calls present in `index.ts`.

---

### T3.4 — Final `index.ts` (assembled)

After completing T0.4 through T3.3, `index.ts` should look exactly like this. Use this as a reference to verify all pieces are wired correctly.

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SERVER_NAME, SERVER_VERSION } from './constants.js';
import { loadKnowledgeBase, getAllDocuments } from './knowledge-base.js';
import { buildSearchIndex } from './search.js';
import { registerResources } from './resources.js';
import { registerTools } from './tools.js';
import { registerPrompts } from './prompts.js';

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

async function main() {
  await loadKnowledgeBase();
  buildSearchIndex(getAllDocuments());

  registerResources(server);
  registerTools(server);
  registerPrompts(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`${SERVER_NAME} v${SERVER_VERSION} started\n`);
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err}\n`);
  process.exit(1);
});
```

---

### T4.1 — Smoke test with MCP Inspector

**Goal**: Verify the server responds correctly to MCP protocol messages.

**Install inspector** (one-time):
```bash
npm install -g @modelcontextprotocol/inspector
```

**Run**:
```bash
cd second-brain/mcp
npx @modelcontextprotocol/inspector npm run dev
```

This opens a browser UI. In the UI:

1. **Resources tab** → click `brain://index` → should return JSON list of documents
2. **Resources tab** → click `brain://projects/audio-forge` → should return markdown
3. **Tools tab** → call `search_brain` with `{"query": "job queue"}` → should return results
4. **Tools tab** → call `get_document` with `{"slug": "projects/audio-forge"}` → should return full markdown
5. **Prompts tab** → call `project_context` with `{"project": "audio-forge"}` → should return framed message

**Success**: All 5 checks return expected data without errors.

---

### T4.2 — Configure Claude Code integration

**Goal**: Add the MCP server to Claude Code so it's available in every session.

**Edit**: `~/.claude/settings.json`

Add to the `mcpServers` object:
```json
{
  "mcpServers": {
    "second-brain": {
      "command": "node",
      "args": ["/Users/jasonbelcher/Documents/code/second-brain/mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

**Build first**:
```bash
cd second-brain/mcp
npm run build
```

**Or for development (no build step)**:
```json
{
  "mcpServers": {
    "second-brain": {
      "command": "npx",
      "args": ["tsx", "/Users/jasonbelcher/Documents/code/second-brain/mcp/src/index.ts"],
      "env": {}
    }
  }
}
```

**Restart Claude Code**, then verify with:
```
/mcp
```
Should show `second-brain` as a connected server.

**Test in a Claude Code session**:
```
use the search_brain tool to find information about the AudioForge job queue
```

**Success**: Agent uses the tool and returns accurate information from the knowledge base.

---

## 8. Claude Code Integration

### Config location
`~/.claude/settings.json` → `mcpServers` key

### Development mode (tsx, no build)
```json
"second-brain": {
  "command": "npx",
  "args": ["tsx", "/Users/jasonbelcher/Documents/code/second-brain/mcp/src/index.ts"]
}
```

### Production mode (compiled)
```json
"second-brain": {
  "command": "node",
  "args": ["/Users/jasonbelcher/Documents/code/second-brain/mcp/dist/index.js"]
}
```

### Claude Desktop integration
Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "second-brain": {
      "command": "npx",
      "args": ["tsx", "/Users/jasonbelcher/Documents/code/second-brain/mcp/src/index.ts"]
    }
  }
}
```

### Adding new documents
1. Drop a `.md` file into `projects/` or `preferences/`
2. Restart the MCP server
3. New file is automatically indexed and searchable

---

## 9. Testing Checklist

Run through this after completing all tasks.

| Check | Command / Action | Expected |
|-------|-----------------|----------|
| Dev server starts | `npm run dev` | Prints server started, waits |
| TypeScript compiles | `npx tsc --noEmit` | No errors |
| Inspector — index resource | UI: read `brain://index` | JSON array of 3 docs |
| Inspector — doc resource | UI: read `brain://projects/audio-forge` | Full markdown |
| Inspector — search tool | `search_brain {"query": "wavesurfer"}` | ≥1 result with excerpt |
| Inspector — get_document | `get_document {"slug": "preferences/coding-style"}` | Full markdown |
| Inspector — prompt | `project_context {"project": "audio-forge"}` | Framed message |
| Missing doc | `get_document {"slug": "fake/doc"}` | `isError: true` response |
| Claude Code `/mcp` | List connected servers | `second-brain` appears |
| End-to-end | Ask agent about AudioForge | Correct info from knowledge base |

---

## Appendix — Haiku Prompt Template

When delegating a task card to Haiku, use this wrapper:

```
You are implementing one specific task of a Node.js MCP server.

CONTEXT:
- Project: second-brain/mcp
- Language: TypeScript (ESM modules)
- MCP SDK: @modelcontextprotocol/sdk v1.x

YOUR TASK: [paste task card here]

RULES:
1. Only create or edit the files listed in the task card
2. Do not modify any other files
3. Keep each file under 80 lines
4. Use .js extensions in import paths (TypeScript ESM requirement)
5. Log only to process.stderr, never stdout
6. Run the success check and confirm it passes before finishing

When done, state: "Task complete. Success criteria met: [describe what you verified]"
```

---

*This spec is complete. Implement tasks in order: T0.1 → T0.2 → T0.3 → T0.4 → T1.1 → T1.2 → T2.1 → T2.2 → T3.1 → T3.2 → T3.3 → T3.4 → T4.1 → T4.2*
