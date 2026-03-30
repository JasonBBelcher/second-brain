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

// Resources, tools, and prompts will be registered here in later tasks

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
