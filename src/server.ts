import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  CallToolRequest,
  McpError,
  ErrorCode
} from '@modelcontextprotocol/sdk/types.js';
import { GitHubClient } from './github/client';
import { ReadPRTool } from './tools/read-pr';
import { ListFilesTool } from './tools/list-files';
import { ReadFileTool } from './tools/read-file';
import { createPRTool } from './tools/create-pr';
import { ManageIssueTool } from './tools/manage-issue';
import { RepoInfoTool } from './tools/repo-info';
import { ReviewPRTool } from './tools/review-pr';
import { SearchCodeTool } from './tools/search-code';
import { MCPTool } from './types/mcp';
import { createLogger } from './utils/logger';
import { z } from 'zod';

const logger = createLogger('MCPServer');

export class GitHubPRServer {
  private server: Server;
  private githubClient: GitHubClient;
  private tools: Map<string, MCPTool>;

  constructor() {
    this.server = new Server(
      {
        name: 'github-pr-manager',
        version: '1.0.0'
      },
      {
        capabilities: {
          tools: {},
          logging: {}
        }
      }
    );

    this.githubClient = new GitHubClient(process.env.GITHUB_TOKEN);
    this.tools = new Map();

    this.registerTools();
    this.setupHandlers();
  }

  private registerTools(): void {
    const toolInstances = [
      new ReadPRTool(this.githubClient),
      new ListFilesTool(this.githubClient),
      new ReadFileTool(this.githubClient),
      new ManageIssueTool(this.githubClient),
      new RepoInfoTool(this.githubClient),
      new ReviewPRTool(this.githubClient),
      new SearchCodeTool(this.githubClient)
    ];

    // Register create-pr tool with manual JSON schema conversion
    this.tools.set(createPRTool.name, {
      name: createPRTool.name,
      description: createPRTool.description,
      inputSchema: createPRTool.inputSchema as any, // JSON Schema format
      handler: createPRTool.handler,
      isJsonSchema: true // Flag to indicate this uses JSON Schema directly
    } as any);

    for (const tool of toolInstances) {
      this.tools.set(tool.name, tool);
      logger.info({ tool: tool.name }, 'Tool registered');
    }
  }

  private setupHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.debug('Listing available tools');

      const tools = Array.from(this.tools.values()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: (tool as any).isJsonSchema ? tool.inputSchema : this.zodToJsonSchema(tool.inputSchema)
      }));

      return { tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
      const { name, arguments: args } = request.params;

      logger.info({ tool: name, args }, 'Tool called');

      const tool = this.tools.get(name);
      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Tool "${name}" not found`
        );
      }

      const response = await tool.handler(args);

      if (response.isError) {
        logger.error({ tool: name, response }, 'Tool returned error');
      } else {
        logger.info({ tool: name }, 'Tool executed successfully');
      }

      return {
        content: response.content,
        _meta: response._meta
      };
    });

    this.server.onerror = (error) => {
      logger.error({ error }, 'Server error');
    };

    process.on('SIGINT', async () => {
      logger.info('Shutting down server (SIGINT)');
      await this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down server (SIGTERM)');
      await this.stop();
      process.exit(0);
    });
  }

  private zodToJsonSchema(schema: z.ZodSchema<any>): any {
    if (schema instanceof z.ZodObject) {
      const shape = schema.shape;
      const properties: any = {};
      const required: string[] = [];

      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as z.ZodSchema<any>;
        properties[key] = this.zodFieldToJsonSchema(fieldSchema);

        if (!fieldSchema.isOptional()) {
          required.push(key);
        }
      }

      return {
        type: 'object',
        properties,
        required: required.length > 0 ? required : undefined
      };
    }

    return {};
  }

  private zodFieldToJsonSchema(schema: z.ZodSchema<any>): any {
    if (schema instanceof z.ZodString) {
      return {
        type: 'string',
        description: (schema as any)._def.description
      };
    }
    if (schema instanceof z.ZodNumber) {
      return {
        type: 'number',
        description: (schema as any)._def.description
      };
    }
    if (schema instanceof z.ZodBoolean) {
      return {
        type: 'boolean',
        description: (schema as any)._def.description
      };
    }
    if (schema instanceof z.ZodEnum) {
      return {
        type: 'string',
        enum: (schema as any)._def.values,
        description: (schema as any)._def.description
      };
    }
    if (schema instanceof z.ZodArray) {
      return {
        type: 'array',
        items: this.zodFieldToJsonSchema((schema as any)._def.type),
        description: (schema as any)._def.description
      };
    }
    if (schema instanceof z.ZodOptional) {
      const innerSchema = this.zodFieldToJsonSchema((schema as any)._def.innerType);
      return { ...innerSchema, required: false };
    }
    if (schema instanceof z.ZodDefault) {
      const innerSchema = this.zodFieldToJsonSchema((schema as any)._def.innerType);
      return {
        ...innerSchema,
        default: (schema as any)._def.defaultValue(),
        required: false
      };
    }
    if (schema instanceof z.ZodObject) {
      return this.zodToJsonSchema(schema);
    }

    return { type: 'any' };
  }

  async start(): Promise<void> {
    const transport = new StdioServerTransport();

    // Skip GitHub connection test to avoid startup issues
    // Connection will be tested on first API call
    logger.info('Starting MCP server without initial GitHub test...');

    try {
      await this.server.connect(transport);
      logger.info('MCP server started successfully');

      // Test GitHub connection in background (non-blocking)
      this.githubClient.testConnection().then(connected => {
        if (connected) {
          logger.info('GitHub API connection verified');
        } else {
          logger.warn('GitHub API connection failed - check your GITHUB_TOKEN');
        }
      }).catch(err => {
        logger.warn({ error: err }, 'GitHub API test failed');
      });
    } catch (error) {
      logger.error({ error }, 'Failed to start MCP server');
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping server...');
    await this.server.close();
    logger.info('Server stopped');
  }
}