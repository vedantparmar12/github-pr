import { z } from 'zod';
import { ToolResponse } from '../types/mcp';
export declare abstract class BaseTool {
    abstract name: string;
    abstract description: string;
    abstract inputSchema: z.ZodSchema<any>;
    protected logger: import("pino").default.Logger<never>;
    abstract execute(input: unknown): Promise<ToolResponse>;
    handler(args: unknown): Promise<ToolResponse>;
    protected createSuccessResponse(text: string): ToolResponse;
    protected createErrorResponse(message: string): ToolResponse;
}
//# sourceMappingURL=base-tool.d.ts.map