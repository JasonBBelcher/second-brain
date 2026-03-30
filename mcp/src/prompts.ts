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
