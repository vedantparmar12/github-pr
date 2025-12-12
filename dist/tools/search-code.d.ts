import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const SearchCodeSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    query: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
    path: z.ZodOptional<z.ZodString>;
    extension: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    query: string;
    per_page: number;
    page: number;
    path?: string | undefined;
    language?: string | undefined;
    extension?: string | undefined;
}, {
    owner: string;
    repo: string;
    query: string;
    path?: string | undefined;
    per_page?: number | undefined;
    page?: number | undefined;
    language?: string | undefined;
    extension?: string | undefined;
}>;
export declare class SearchCodeTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        query: z.ZodString;
        language: z.ZodOptional<z.ZodString>;
        path: z.ZodOptional<z.ZodString>;
        extension: z.ZodOptional<z.ZodString>;
        page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        per_page: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        query: string;
        per_page: number;
        page: number;
        path?: string | undefined;
        language?: string | undefined;
        extension?: string | undefined;
    }, {
        owner: string;
        repo: string;
        query: string;
        path?: string | undefined;
        per_page?: number | undefined;
        page?: number | undefined;
        language?: string | undefined;
        extension?: string | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: z.infer<typeof SearchCodeSchema>): Promise<ToolResponse>;
    private buildQuery;
    private processResults;
    private groupByFile;
    private formatOutput;
}
export {};
//# sourceMappingURL=search-code.d.ts.map