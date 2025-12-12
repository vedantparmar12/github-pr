import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const ReadAnyFileSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    path: z.ZodString;
    ref: z.ZodOptional<z.ZodString>;
    context_token: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    path: string;
    owner: string;
    repo: string;
    context_token?: string | undefined;
    ref?: string | undefined;
}, {
    path: string;
    owner: string;
    repo: string;
    context_token?: string | undefined;
    ref?: string | undefined;
}>;
export declare class ReadAnyFileTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        path: z.ZodString;
        ref: z.ZodOptional<z.ZodString>;
        context_token: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        owner: string;
        repo: string;
        context_token?: string | undefined;
        ref?: string | undefined;
    }, {
        path: string;
        owner: string;
        repo: string;
        context_token?: string | undefined;
        ref?: string | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: z.infer<typeof ReadAnyFileSchema>): Promise<ToolResponse>;
    private chunkContent;
    private formatResponse;
    private handlePagination;
    private addLineNumbers;
    private getExtension;
    private getLanguage;
    private formatSize;
}
export {};
//# sourceMappingURL=read-any-file.d.ts.map