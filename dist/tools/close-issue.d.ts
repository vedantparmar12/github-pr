import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const CloseIssueInputSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    issue_number: z.ZodNumber;
    reason: z.ZodDefault<z.ZodOptional<z.ZodEnum<["completed", "not_planned"]>>>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    issue_number: number;
    reason: "completed" | "not_planned";
    comment?: string | undefined;
}, {
    owner: string;
    repo: string;
    issue_number: number;
    comment?: string | undefined;
    reason?: "completed" | "not_planned" | undefined;
}>;
export declare class CloseIssueTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        issue_number: z.ZodNumber;
        reason: z.ZodDefault<z.ZodOptional<z.ZodEnum<["completed", "not_planned"]>>>;
        comment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        issue_number: number;
        reason: "completed" | "not_planned";
        comment?: string | undefined;
    }, {
        owner: string;
        repo: string;
        issue_number: number;
        comment?: string | undefined;
        reason?: "completed" | "not_planned" | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: z.infer<typeof CloseIssueInputSchema>): Promise<ToolResponse>;
}
export {};
//# sourceMappingURL=close-issue.d.ts.map