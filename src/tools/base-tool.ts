import { z } from 'zod';
import { ToolResponse } from '../types/mcp';
import { createLogger } from '../utils/logger';

export abstract class BaseTool {
    abstract name: string;
    abstract description: string;
    abstract inputSchema: z.ZodSchema<any>;

    protected logger = createLogger(this.constructor.name);

    abstract execute(input: unknown): Promise<ToolResponse>;

    async handler(args: unknown): Promise<ToolResponse> {
        try {
            const input = this.inputSchema.parse(args);
            return await this.execute(input);
        } catch (error: any) {
            return this.createErrorResponse(error.message || 'Unknown error occurred');
        }
    }

    protected createSuccessResponse(text: string): ToolResponse {
        return { content: [{ type: 'text', text }] };
    }

    protected createErrorResponse(message: string): ToolResponse {
        return { content: [{ type: 'text', text: `Error in ${this.name}: ${message}` }], isError: true };
    }
}
