import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
declare const ReviewPRSchema: z.ZodObject<{
    owner: z.ZodString;
    repo: z.ZodString;
    pr_number: z.ZodNumber;
    action: z.ZodEnum<["comment", "submit"]>;
    path: z.ZodOptional<z.ZodString>;
    line: z.ZodOptional<z.ZodNumber>;
    start_line: z.ZodOptional<z.ZodNumber>;
    side: z.ZodDefault<z.ZodOptional<z.ZodEnum<["LEFT", "RIGHT"]>>>;
    body: z.ZodOptional<z.ZodString>;
    event: z.ZodOptional<z.ZodEnum<["APPROVE", "REQUEST_CHANGES", "COMMENT", "PENDING"]>>;
    comments: z.ZodOptional<z.ZodArray<z.ZodObject<{
        path: z.ZodString;
        line: z.ZodNumber;
        body: z.ZodString;
        start_line: z.ZodOptional<z.ZodNumber>;
        side: z.ZodOptional<z.ZodEnum<["LEFT", "RIGHT"]>>;
    }, "strip", z.ZodTypeAny, {
        body: string;
        path: string;
        line: number;
        start_line?: number | undefined;
        side?: "LEFT" | "RIGHT" | undefined;
    }, {
        body: string;
        path: string;
        line: number;
        start_line?: number | undefined;
        side?: "LEFT" | "RIGHT" | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    owner: string;
    repo: string;
    side: "LEFT" | "RIGHT";
    pr_number: number;
    action: "comment" | "submit";
    body?: string | undefined;
    comments?: {
        body: string;
        path: string;
        line: number;
        start_line?: number | undefined;
        side?: "LEFT" | "RIGHT" | undefined;
    }[] | undefined;
    path?: string | undefined;
    line?: number | undefined;
    start_line?: number | undefined;
    event?: "PENDING" | "APPROVE" | "REQUEST_CHANGES" | "COMMENT" | undefined;
}, {
    owner: string;
    repo: string;
    pr_number: number;
    action: "comment" | "submit";
    body?: string | undefined;
    comments?: {
        body: string;
        path: string;
        line: number;
        start_line?: number | undefined;
        side?: "LEFT" | "RIGHT" | undefined;
    }[] | undefined;
    path?: string | undefined;
    line?: number | undefined;
    start_line?: number | undefined;
    side?: "LEFT" | "RIGHT" | undefined;
    event?: "PENDING" | "APPROVE" | "REQUEST_CHANGES" | "COMMENT" | undefined;
}>;
type ReviewPRInput = z.infer<typeof ReviewPRSchema>;
export declare class ReviewPRTool implements MCPTool {
    private githubClient;
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        owner: z.ZodString;
        repo: z.ZodString;
        pr_number: z.ZodNumber;
        action: z.ZodEnum<["comment", "submit"]>;
        path: z.ZodOptional<z.ZodString>;
        line: z.ZodOptional<z.ZodNumber>;
        start_line: z.ZodOptional<z.ZodNumber>;
        side: z.ZodDefault<z.ZodOptional<z.ZodEnum<["LEFT", "RIGHT"]>>>;
        body: z.ZodOptional<z.ZodString>;
        event: z.ZodOptional<z.ZodEnum<["APPROVE", "REQUEST_CHANGES", "COMMENT", "PENDING"]>>;
        comments: z.ZodOptional<z.ZodArray<z.ZodObject<{
            path: z.ZodString;
            line: z.ZodNumber;
            body: z.ZodString;
            start_line: z.ZodOptional<z.ZodNumber>;
            side: z.ZodOptional<z.ZodEnum<["LEFT", "RIGHT"]>>;
        }, "strip", z.ZodTypeAny, {
            body: string;
            path: string;
            line: number;
            start_line?: number | undefined;
            side?: "LEFT" | "RIGHT" | undefined;
        }, {
            body: string;
            path: string;
            line: number;
            start_line?: number | undefined;
            side?: "LEFT" | "RIGHT" | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        owner: string;
        repo: string;
        side: "LEFT" | "RIGHT";
        pr_number: number;
        action: "comment" | "submit";
        body?: string | undefined;
        comments?: {
            body: string;
            path: string;
            line: number;
            start_line?: number | undefined;
            side?: "LEFT" | "RIGHT" | undefined;
        }[] | undefined;
        path?: string | undefined;
        line?: number | undefined;
        start_line?: number | undefined;
        event?: "PENDING" | "APPROVE" | "REQUEST_CHANGES" | "COMMENT" | undefined;
    }, {
        owner: string;
        repo: string;
        pr_number: number;
        action: "comment" | "submit";
        body?: string | undefined;
        comments?: {
            body: string;
            path: string;
            line: number;
            start_line?: number | undefined;
            side?: "LEFT" | "RIGHT" | undefined;
        }[] | undefined;
        path?: string | undefined;
        line?: number | undefined;
        start_line?: number | undefined;
        side?: "LEFT" | "RIGHT" | undefined;
        event?: "PENDING" | "APPROVE" | "REQUEST_CHANGES" | "COMMENT" | undefined;
    }>;
    constructor(githubClient: GitHubClient);
    handler(args: ReviewPRInput): Promise<ToolResponse>;
    private addComment;
    private submitReview;
    private getDefaultBody;
}
export {};
//# sourceMappingURL=review-pr.d.ts.map