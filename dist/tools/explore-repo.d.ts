import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const ExploreRepoSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    ref: z.ZodOptional<z.ZodString>;
    depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    path: string;
    owner: string;
    repo: string;
    depth: number;
    ref?: string | undefined;
}, {
    owner: string;
    repo: string;
    path?: string | undefined;
    ref?: string | undefined;
    depth?: number | undefined;
}>;
export declare class ExploreRepoTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        ref: z.ZodOptional<z.ZodString>;
        depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        owner: string;
        repo: string;
        depth: number;
        ref?: string | undefined;
    }, {
        owner: string;
        repo: string;
        path?: string | undefined;
        ref?: string | undefined;
        depth?: number | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: z.infer<typeof ExploreRepoSchema>): Promise<ToolResponse>;
    private buildTree;
    private getExtension;
    private calculateStats;
    private formatOutput;
    private renderTree;
    private formatSize;
}
export {};
//# sourceMappingURL=explore-repo.d.ts.map