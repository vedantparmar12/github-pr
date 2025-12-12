import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const RepoInfoSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    action: z.ZodDefault<z.ZodEnum<["stats", "explore", "both"]>>;
    path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    ref: z.ZodOptional<z.ZodString>;
    depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    path: string;
    owner: string;
    repo: string;
    action: "stats" | "explore" | "both";
    depth: number;
    ref?: string | undefined;
}, {
    owner: string;
    repo: string;
    path?: string | undefined;
    action?: "stats" | "explore" | "both" | undefined;
    ref?: string | undefined;
    depth?: number | undefined;
}>;
type RepoInfoInput = z.infer<typeof RepoInfoSchema>;
export declare class RepoInfoTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        action: z.ZodDefault<z.ZodEnum<["stats", "explore", "both"]>>;
        path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        ref: z.ZodOptional<z.ZodString>;
        depth: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        path: string;
        owner: string;
        repo: string;
        action: "stats" | "explore" | "both";
        depth: number;
        ref?: string | undefined;
    }, {
        owner: string;
        repo: string;
        path?: string | undefined;
        action?: "stats" | "explore" | "both" | undefined;
        ref?: string | undefined;
        depth?: number | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: RepoInfoInput): Promise<ToolResponse>;
    private addStats;
    private addExplore;
    private buildTree;
    private calculateStats;
    private renderTree;
}
export {};
//# sourceMappingURL=repo-info.d.ts.map