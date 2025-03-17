# mcp-flux-schnell MCP Server

A TypeScript-based MCP server that implements a text-to-image generation tool using the Flux Schnell model. This server integrates with Cloudflare's Flux Schnell worker API to provide image generation capabilities through MCP.

## Features

### Tools
- `generate_image` - Generate images from text descriptions
  - Takes a text prompt as input (1-2048 characters)
  - Returns the path to the generated image file

## Environment Variables

The following environment variables must be configured:

- `FLUX_API_URL` - The URL of the Flux Schnell API endpoint
- `FLUX_API_TOKEN` - Your authentication token for the Flux Schnell API
- `WORKING_DIR` (optional) - Directory where generated images will be saved (defaults to current working directory)

## Development

Install dependencies:
```bash
npm install
# or
pnpm install
```

Build the server:
```bash
npm run build
# or
pnpm build
```

## Installation

### Cursor Configuration

There are two ways to configure the MCP server in Cursor:

#### Project Configuration

For tools specific to a project, create a `.cursor/mcp.json` file in your project directory:

```json
{
  "mcpServers": {
    "mcp-flux-schnell": {
      "command": "node",
      "args": ["/path/to/mcp-flux-schnell/build/index.js"],
      "env": {
        "FLUX_API_URL": "your flux api url",
        "FLUX_API_TOKEN": "your flux api token",
        "WORKING_DIR": "your working directory"
      }
    }
  }
}
```

This configuration will only be available within the specific project.

#### Global Configuration

For tools that you want to use across all projects, create a `~/.cursor/mcp.json` file in your home directory with the same configuration:

```json
{
  "mcpServers": {
    "mcp-flux-schnell": {
      "command": "node",
      "args": ["/path/to/mcp-flux-schnell/build/index.js"],
      "env": {
        "FLUX_API_URL": "your flux api url",
        "FLUX_API_TOKEN": "your flux api token",
        "WORKING_DIR": "your working directory"
      }
    }
  }
}
```

This makes the MCP server available in all your Cursor workspaces.
