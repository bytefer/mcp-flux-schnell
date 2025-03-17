#!/usr/bin/env node

/**
 * MCP server for Cloudflare Flux Schnell worker API
 * This server implements a text-to-image generation tool using the Flux Schnell model
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";

// Environment variable configuration
const FLUX_API_URL = process.env.FLUX_API_URL;
const FLUX_API_TOKEN = process.env.FLUX_API_TOKEN;
const WORKING_DIR = process.env.WORKING_DIR || process.cwd()

// Input parameter validation
const generateImageSchema = z.object({
  prompt: z.string().min(1).max(2048),
});

/**
 * Create an MCP server with tools capability (image generation)
 */
const server = new Server(
  {
    name: "mcp-flux-schnell",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Handler for listing available tools
 * Exposes a single "generate_image" tool that allows clients to generate images
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "generate_image",
        description:
          "Generate an image from a text prompt using Flux Schnell model",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              minLength: 1,
              maxLength: 2048,
              description:
                "A text description of the image you want to generate.",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

/**
 * Handler for the generate_image tool
 * Uses the Flux Schnell API to generate an image and returns the result
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  switch (request.params.name) {
    case "generate_image": {
      // Validate environment variables
      if (!FLUX_API_URL) {
        return {
          content: [
            {
              type: "text",
              text: "Configuration Error: FLUX_API_URL environment variable is not set",
            },
          ],
        };
      }
      if (!FLUX_API_TOKEN) {
        return {
          content: [
            {
              type: "text",
              text: "Configuration Error: FLUX_API_TOKEN environment variable is not set",
            },
          ],
        };
      }

      // Validate input parameters
      const validationResult = generateImageSchema.safeParse(
        request.params.arguments
      );
      if (!validationResult.success) {
        return {
          content: [
            {
              type: "text",
              text: `Input Error: ${validationResult.error.message}`,
            },
          ],
        };
      }

      const { prompt } = validationResult.data;
      const timestamp = new Date().getTime();
      const filename = `flux-${timestamp}.png`;
      const directory = WORKING_DIR;
      const filepath = join(directory, filename);

      // Check if directory exists
      if (!existsSync(directory)) {
        return {
          content: [
            {
              type: "text",
              text: `Directory Error: The specified directory does not exist: ${directory}`,
            },
          ],
        };
      }

      try {
        // Call Flux Schnell API
        const response = await fetch(FLUX_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FLUX_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          return {
            content: [
              {
                type: "text",
                text: `API Error: Flux API returned status ${response.status}: ${errorText}`,
              },
            ],
          };
        }

        const result = await response.json();
        const base64Data = result.image.replace(/^data:image\/png;base64,/, "");
        await writeFile(filepath, Buffer.from(base64Data, "base64"));

        return {
          content: [
            {
              type: "text",
              text: `Image saved successfully:\nFilename: ${filename}\nPath: ${filepath}`,
            },
          ],
        };
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        return {
          content: [
            {
              type: "text",
              text: `Operation Error: Failed to generate or save image: ${errorMessage}`,
            },
          ],
        };
      }
    }

    default:
      return {
        content: [
          {
            type: "text",
            text: "Tool Error: Unknown tool requested",
          },
        ],
      };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
