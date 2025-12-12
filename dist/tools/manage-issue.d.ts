import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const ManageIssueSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    action: z.ZodEnum<["create", "update", "close"]>;
    issue_number: z.ZodOptional<z.ZodNumber>;
    title: z.ZodOptional<z.ZodString>;
    body: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodEnum<["open", "closed"]>>;
    state_reason: z.ZodOptional<z.ZodEnum<["completed", "not_planned", "reopened"]>>;
    labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
    comment: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    action: "create" | "update" | "close";
    title?: string | undefined;
    body?: string | undefined;
    state?: "open" | "closed" | undefined;
    assignees?: string[] | undefined;
    labels?: string[] | undefined;
    issue_number?: number | undefined;
    state_reason?: "completed" | "not_planned" | "reopened" | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    comment?: string | undefined;
}, {
    owner: string;
    repo: string;
    action: "create" | "update" | "close";
    title?: string | undefined;
    body?: string | undefined;
    state?: "open" | "closed" | undefined;
    assignees?: string[] | undefined;
    labels?: string[] | undefined;
    issue_number?: number | undefined;
    state_reason?: "completed" | "not_planned" | "reopened" | undefined;
    priority?: "low" | "medium" | "high" | "critical" | undefined;
    comment?: string | undefined;
}>;
type ManageIssueInput = z.infer<typeof ManageIssueSchema>;
export declare class ManageIssueTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        action: z.ZodEnum<["create", "update", "close"]>;
        issue_number: z.ZodOptional<z.ZodNumber>;
        title: z.ZodOptional<z.ZodString>;
        body: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodEnum<["open", "closed"]>>;
        state_reason: z.ZodOptional<z.ZodEnum<["completed", "not_planned", "reopened"]>>;
        labels: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        assignees: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        priority: z.ZodOptional<z.ZodEnum<["low", "medium", "high", "critical"]>>;
        comment: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        action: "create" | "update" | "close";
        title?: string | undefined;
        body?: string | undefined;
        state?: "open" | "closed" | undefined;
        assignees?: string[] | undefined;
        labels?: string[] | undefined;
        issue_number?: number | undefined;
        state_reason?: "completed" | "not_planned" | "reopened" | undefined;
        priority?: "low" | "medium" | "high" | "critical" | undefined;
        comment?: string | undefined;
    }, {
        owner: string;
        repo: string;
        action: "create" | "update" | "close";
        title?: string | undefined;
        body?: string | undefined;
        state?: "open" | "closed" | undefined;
        assignees?: string[] | undefined;
        labels?: string[] | undefined;
        issue_number?: number | undefined;
        state_reason?: "completed" | "not_planned" | "reopened" | undefined;
        priority?: "low" | "medium" | "high" | "critical" | undefined;
        comment?: string | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: ManageIssueInput): Promise<ToolResponse>;
    private createIssue;
    private updateIssue;
    private closeIssue;
}
export {};
//# sourceMappingURL=manage-issue.d.ts.map