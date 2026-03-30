# Second Brain MCP Server

An MCP (Model Context Protocol) server that exposes the second-brain knowledge base to Claude agents.

## Getting Started

### Installation

```bash
cd second-brain/mcp
npm install
```

### Configuration

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and set your values:

```env
PORT=3000
API_KEY=your-secure-api-key-here
```

**⚠️ Never commit `.env` to version control** — it contains secrets.

### Development

Run the server directly with tsx (no build needed):

```bash
npm run dev
```

Or with HTTP server:

```bash
npm run dev:http
```

The server will start and wait for connections (MCP stdio or HTTP).

### Building

Compile TypeScript to JavaScript:

```bash
npm run build
```

This generates `dist/` directory with compiled files.

### Running the Built Server

```bash
npm start
```

Or directly with Node:

```bash
node dist/index.js
```

## MCP API

### Resources

- **`brain://index`** — JSON array of all available documents
- **`brain://projects/audio-forge`** — Full markdown for AudioForge project
- **`brain://projects/xalpheric-neocities`** — Full markdown for Xalpheric Neocities project
- **`brain://preferences/coding-style`** — Coding style and preferences

### Tools

- **`search_brain`** — Fuzzy-search across all documents
  - Input: `{ query: string, limit?: number }`
  - Returns: Ranked results with excerpts and relevance scores

- **`get_document`** — Fetch a single document by slug
  - Input: `{ slug: string }`
  - Returns: Full markdown content

### Prompts

- **`project_context`** — Load full project documentation
  - Input: `{ project: "audio-forge" | "xalpheric-neocities" }`
  - Returns: Project context framed for the agent

## Testing

### With MCP Inspector

Install the inspector:

```bash
npm install -g @modelcontextprotocol/inspector
```

Run the smoke test:

```bash
npx @modelcontextprotocol/inspector npm run dev
```

This opens a browser UI where you can:
- Read resources
- Call tools
- Invoke prompts

### In Claude Code

Once configured in `~/.claude/settings.json`, verify with:

```
/mcp
```

Should show `second-brain` as a connected server.

## Adding Documents

Drop a new `.md` file into:
- `projects/` for project documentation
- `preferences/` for preference files

The server automatically indexes all markdown files on startup.

## Integration

### Claude Code

Edit `~/.claude/settings.json`:

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

### Claude Desktop

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

## Project Structure

```
mcp/
├── src/
│   ├── index.ts           — Entry point, server setup
│   ├── constants.ts       — Configuration and paths
│   ├── knowledge-base.ts  — Load and index markdown files
│   ├── search.ts          — Fuse.js wrapper for fuzzy search
│   ├── resources.ts       — MCP resource registration
│   ├── tools.ts           — MCP tool registration
│   └── prompts.ts         — MCP prompt registration
├── dist/                  — Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

## Tech Stack

- **TypeScript** — Strict mode, ES2020 target
- **@modelcontextprotocol/sdk** — Official MCP framework
- **fuse.js** — Fuzzy search
- **gray-matter** — YAML frontmatter parsing
- **zod** — Schema validation
- **tsx** — Development TypeScript runner

## License

MIT
