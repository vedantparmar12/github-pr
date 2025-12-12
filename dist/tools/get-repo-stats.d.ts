import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const GetRepoStatsSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    include_contributors: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_languages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    include_activity: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    include_contributors: boolean;
    include_languages: boolean;
    include_activity: boolean;
}, {
    owner: string;
    repo: string;
    include_contributors?: boolean | undefined;
    include_languages?: boolean | undefined;
    include_activity?: boolean | undefined;
}>;
export declare class GetRepoStatsTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        include_contributors: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        include_languages: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
        include_activity: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        include_contributors: boolean;
        include_languages: boolean;
        include_activity: boolean;
    }, {
        owner: string;
        repo: string;
        include_contributors?: boolean | undefined;
        include_languages?: boolean | undefined;
        include_activity?: boolean | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: z.infer<typeof GetRepoStatsSchema>): Promise<ToolResponse>;
    private getContributors;
    private getLanguages;
    private extractRepoInfo;
    private formatOutput;
    private createLanguageBar;
    private formatSize;
}
export {};
//# sourceMappingURL=get-repo-stats.d.ts.map