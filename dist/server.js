"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitHubPRServer = void 0;
const index_js_1 = require("@modelcontextprotocol/sdk/server/index.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const client_1 = require("./github/client");
const read_pr_1 = require("./tools/read-pr");
const list_files_1 = require("./tools/list-files");
const read_file_1 = require("./tools/read-file");
const create_pr_1 = require("./tools/create-pr");
const manage_issue_1 = require("./tools/manage-issue");
const repo_info_1 = require("./tools/repo-info");
const review_pr_1 = require("./tools/review-pr");
const search_code_1 = require("./tools/search-code");
const logger_1 = require("./utils/logger");
const zod_1 = require("zod");
const logger = (0, logger_1.createLogger)('MCPServer');
class GitHubPRServer {
    server;
    githubClient;
    tools;
    constructor() {
        this.server = new index_js_1.Server({
            name: 'github-pr-manager',
            version: '1.0.0'
        }, {
            capabilities: {
                tools: {},
                logging: {}
            }
        });
        this.githubClient = new client_1.GitHubClient(process.env.GITHUB_TOKEN);
        this.tools = new Map();
        this.registerTools();
        this.setupHandlers();
    }
    registerTools() {
        const toolInstances = [
            new read_pr_1.ReadPRTool(this.githubClient),
            new list_files_1.ListFilesTool(this.githubClient),
            new read_file_1.ReadFileTool(this.githubClient),
            new manage_issue_1.ManageIssueTool(this.githubClient),
            new repo_info_1.RepoInfoTool(this.githubClient),
            new review_pr_1.ReviewPRTool(this.githubClient),
            new search_code_1.SearchCodeTool(this.githubClient)
        ];
        // Register create-pr tool with manual JSON schema conversion
        this.tools.set(create_pr_1.createPRTool.name, {
            name: create_pr_1.createPRTool.name,
            description: create_pr_1.createPRTool.description,
            inputSchema: create_pr_1.createPRTool.inputSchema, // JSON Schema format
            handler: create_pr_1.createPRTool.handler,
            isJsonSchema: true // Flag to indicate this uses JSON Schema directly
        });
        for (const tool of toolInstances) {
            this.tools.set(tool.name, tool);
            logger.info({ tool: tool.name }, 'Tool registered');
        }
    }
    setupHandlers() {
        this.server.setRequestHandler(types_js_1.ListToolsRequestSchema, async () => {
            logger.debug('Listing available tools');
            const tools = Array.from(this.tools.values()).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.isJsonSchema ? tool.inputSchema : this.zodToJsonSchema(tool.inputSchema)
            }));
            return { tools };
        });
        this.server.setRequestHandler(types_js_1.CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.info({ tool: name, args }, 'Tool called');
            const tool = this.tools.get(name);
            if (!tool) {
                throw new types_js_1.McpError(types_js_1.ErrorCode.MethodNotFound, `Tool "${name}" not found`);
            }
            const response = await tool.handler(args);
            if (response.isError) {
                logger.error({ tool: name, response }, 'Tool returned error');
            }
            else {
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
    zodToJsonSchema(schema) {
        if (schema instanceof zod_1.z.ZodObject) {
            const shape = schema.shape;
            const properties = {};
            const required = [];
            for (const [key, value] of Object.entries(shape)) {
                const fieldSchema = value;
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
    zodFieldToJsonSchema(schema) {
        if (schema instanceof zod_1.z.ZodString) {
            return {
                type: 'string',
                description: schema._def.description
            };
        }
        if (schema instanceof zod_1.z.ZodNumber) {
            return {
                type: 'number',
                description: schema._def.description
            };
        }
        if (schema instanceof zod_1.z.ZodBoolean) {
            return {
                type: 'boolean',
                description: schema._def.description
            };
        }
        if (schema instanceof zod_1.z.ZodEnum) {
            return {
                type: 'string',
                enum: schema._def.values,
                description: schema._def.description
            };
        }
        if (schema instanceof zod_1.z.ZodArray) {
            return {
                type: 'array',
                items: this.zodFieldToJsonSchema(schema._def.type),
                description: schema._def.description
            };
        }
        if (schema instanceof zod_1.z.ZodOptional) {
            const innerSchema = this.zodFieldToJsonSchema(schema._def.innerType);
            return { ...innerSchema, required: false };
        }
        if (schema instanceof zod_1.z.ZodDefault) {
            const innerSchema = this.zodFieldToJsonSchema(schema._def.innerType);
            return {
                ...innerSchema,
                default: schema._def.defaultValue(),
                required: false
            };
        }
        if (schema instanceof zod_1.z.ZodObject) {
            return this.zodToJsonSchema(schema);
        }
        return { type: 'any' };
    }
    async start() {
        const transport = new stdio_js_1.StdioServerTransport();
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
                }
                else {
                    logger.warn('GitHub API connection failed - check your GITHUB_TOKEN');
                }
            }).catch(err => {
                logger.warn({ error: err }, 'GitHub API test failed');
            });
        }
        catch (error) {
            logger.error({ error }, 'Failed to start MCP server');
            throw error;
        }
    }
    async stop() {
        logger.info('Stopping server...');
        await this.server.close();
        logger.info('Server stopped');
    }
}
exports.GitHubPRServer = GitHubPRServer;
//# sourceMappingURL=server.js.map