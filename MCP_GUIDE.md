# MCP Server Integration Guide

This document explains how to integrate the Nirvana extension with Model Context Protocol (MCP) for more advanced use cases.

## Current Architecture vs MCP Architecture

### Current (OpenAI Function Calling)
```
Chrome Extension → OpenAI API → Function Call → Nirvana API
```

**Pros:**
- Simple to implement
- Works entirely in browser
- No server required
- Low latency

**Cons:**
- Requires OpenAI API key
- Limited to OpenAI models
- Can't use with local LLMs

### With MCP Server
```
Chrome Extension → MCP Server → LLM (Claude/GPT/Local) → Nirvana API
```

**Pros:**
- Standardized protocol
- Works with any MCP-compatible LLM
- Can run locally with Ollama/LM Studio
- Better privacy
- More control over AI behavior

**Cons:**
- Requires running a local server
- More complex setup
- Slightly higher latency

## MCP Server Implementation

Here's a basic MCP server for Nirvana (Node.js/TypeScript):

### 1. Install Dependencies

```bash
npm init -y
npm install @modelcontextprotocol/sdk express cors
npm install -D typescript @types/node @types/express
```

### 2. Create MCP Server (`server.ts`)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Nirvana API client
class NirvanaClient {
  private authToken: string;
  private baseUrl = 'https://gc-api.nirvanahq.com/api';

  constructor(authToken: string) {
    this.authToken = authToken;
  }

  async addTask(name: string, note: string = '', list: string = 'next') {
    const stateMap = { inbox: 0, next: 1, waiting: 2, scheduled: 3, someday: 4 };
    const state = stateMap[list.toLowerCase()] ?? 1;

    const payload = [{
      method: 'task.save',
      id: crypto.randomUUID(),
      name,
      note,
      state,
      type: 0,
      cancelled: false,
      completed: false,
      deleted: false,
      // ... other fields
    }];

    const url = new URL(`${this.baseUrl}/everything`);
    url.searchParams.set('authtoken', this.authToken);
    // ... add other params

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    return response.json();
  }

  async searchTasks(query: string) {
    // Implementation
  }

  async completeTask(id: string) {
    // Implementation
  }

  async deleteTask(id: string) {
    // Implementation
  }
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: 'add_task',
    description: 'Create a new task in Nirvana',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name' },
        note: { type: 'string', description: 'Additional notes' },
        list: {
          type: 'string',
          enum: ['inbox', 'next', 'waiting', 'scheduled', 'someday'],
          description: 'Which list to add to',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_tasks',
    description: 'Search for tasks by keyword',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
      },
      required: ['query'],
    },
  },
  // ... more tools
];

// Create MCP server
const server = new Server(
  {
    name: 'nirvana-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Get auth token from environment
const authToken = process.env.NIRVANA_AUTH_TOKEN;
if (!authToken) {
  throw new Error('NIRVANA_AUTH_TOKEN environment variable not set');
}

const nirvanaClient = new NirvanaClient(authToken);

// Handle tool list request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'add_task':
        const result = await nirvanaClient.addTask(
          args.name as string,
          args.note as string,
          args.list as string
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result),
            },
          ],
        };

      case 'search_tasks':
        const searchResults = await nirvanaClient.searchTasks(args.query as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(searchResults),
            },
          ],
        };

      // ... handle other tools

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Nirvana MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

### 3. Configure Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "nirvana": {
      "command": "node",
      "args": ["/path/to/nirvana-mcp-server/dist/server.js"],
      "env": {
        "NIRVANA_AUTH_TOKEN": "your-token-here"
      }
    }
  }
}
```

### 4. Usage in Claude

```
You: Add buy groceries to my next list in Nirvana

Claude: I'll use the add_task tool to create that task for you.
[Calls add_task with name="buy groceries", list="next"]
Done! I've added "buy groceries" to your Next list in Nirvana.
```

## Integrating with Chrome Extension

To connect your Chrome extension to an MCP server:

### Option 1: Native Messaging

Create a native messaging host that connects to the MCP server:

```javascript
// In extension
const port = chrome.runtime.connectNative('com.nirvana.mcp');
port.postMessage({ action: 'add_task', name: 'Test', list: 'next' });
port.onMessage.addListener((msg) => {
  console.log('Received:', msg);
});
```

### Option 2: HTTP Bridge

Run a simple HTTP server that wraps the MCP server:

```typescript
import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  
  // Send to MCP server, get response
  const result = await mcpClient.sendMessage(message);
  
  res.json(result);
});

app.listen(3000);
```

Then in your extension:

```javascript
// Replace OpenAI API call with local server
const response = await fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: userInput }),
});
```

## Using with Local LLMs

### With Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull a model
ollama pull llama3

# Run with MCP
ollama run llama3 --mcp-server nirvana
```

### With LM Studio

1. Open LM Studio
2. Go to Developer tab
3. Add MCP server configuration
4. Point to your Nirvana MCP server

## Comparison: Current vs MCP

| Feature | OpenAI Function Calling | MCP Server |
|---------|------------------------|------------|
| Setup Complexity | Simple | Moderate |
| Privacy | Data sent to OpenAI | Can be fully local |
| Cost | OpenAI API costs | Free (if local) |
| Model Choice | OpenAI only | Any MCP-compatible |
| Latency | ~1-3s | ~2-5s (local) |
| Offline | No | Yes (with local LLM) |
| Browser Extension | ✅ Works well | Needs bridge |
| Desktop Apps | Needs wrapper | ✅ Native |

## When to Use MCP

Use MCP if you:
- Want to use Claude or other non-OpenAI models
- Need privacy (local LLMs)
- Want to avoid API costs
- Are building desktop apps
- Need advanced tool chaining
- Want standardized protocol

Stick with OpenAI Function Calling if you:
- Want simplest setup
- Are building browser extension only
- Don't mind API costs
- Want lowest latency
- Need best AI quality (GPT-4)

## Resources

- [MCP Documentation](https://modelcontextprotocol.io/)
- [MCP GitHub](https://github.com/modelcontextprotocol)
- [Claude MCP Guide](https://www.anthropic.com/mcp)
- [Building MCP Servers](https://modelcontextprotocol.io/docs/building-servers)

## Future Plans

The extension could be extended to support both:
1. OpenAI Function Calling (for browser use)
2. MCP Server (for desktop use with Claude)

Users could choose their preferred method based on needs.
