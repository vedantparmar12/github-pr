import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';
import { REVIEW_STATUS_MAP } from '../constants';

const logger = createLogger('ReviewPRTool');

const ReviewPRSchema = z.object({
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name'),
    pr_number: z.number().describe('Pull request number'),
    action: z.enum(['comment', 'submit']).describe('Action: add inline comment or submit review'),
    path: z.string().optional().describe('File path for inline comment'),
    line: z.number().optional().describe('Line number for inline comment'),
    start_line: z.number().optional().describe('Start line for multi-line comment'),
    side: z.enum(['LEFT', 'RIGHT']).optional().default('RIGHT').describe('Diff side'),
    body: z.string().optional().describe('Comment or review body'),
    event: z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT', 'PENDING']).optional().describe('Review decision'),
    comments: z.array(z.object({
        path: z.string(),
        line: z.number(),
        body: z.string(),
        start_line: z.number().optional(),
        side: z.enum(['LEFT', 'RIGHT']).optional()
    })).optional().describe('Batch inline comments with review')
});

type ReviewPRInput = z.infer<typeof ReviewPRSchema>;

export class ReviewPRTool implements MCPTool {
    name = 'review-pr';
    description = 'Add inline comments or submit a full review on a pull request';
    inputSchema = ReviewPRSchema;

    constructor(private githubClient: GitHubClient) { }

    async handler(args: ReviewPRInput): Promise<ToolResponse> {
        try {
            logger.info({ owner: args.owner, repo: args.repo, pr_number: args.pr_number, action: args.action }, 'Reviewing PR');

            if (args.action === 'comment') return this.addComment(args);
            if (args.action === 'submit') return this.submitReview(args);
            return { content: [{ type: 'text', text: 'Invalid action' }], isError: true };
        } catch (error) {
            logger.error({ error }, 'Failed to review PR');
            return handleError(error, 'review-pr');
        }
    }

    private async addComment(args: ReviewPRInput): Promise<ToolResponse> {
        if (!args.path || !args.line || !args.body) {
            return { content: [{ type: 'text', text: 'path, line, and body are required for comment action' }], isError: true };
        }

        const comment = await this.githubClient.createReviewComment(
            args.owner,
            args.repo,
            args.pr_number,
            { path: args.path, line: args.line, start_line: args.start_line, side: args.side, body: args.body }
        );

        return {
            content: [{
                type: 'text',
                text: `Comment added!\n\n**File:** ${comment.path}\n**Line:** ${comment.line}\n**Author:** @${comment.user.login}\n\n> ${comment.body}`
            }]
        };
    }

    private async submitReview(args: ReviewPRInput): Promise<ToolResponse> {
        if (!args.event) {
            return { content: [{ type: 'text', text: 'event is required for submit action' }], isError: true };
        }

        const reviewBody = args.body || this.getDefaultBody(args.event);

        const review = await this.githubClient.createReview({
            owner: args.owner,
            repo: args.repo,
            pull_number: args.pr_number,
            event: args.event,
            body: reviewBody,
            comments: args.comments?.map(c => ({
                path: c.path,
                line: c.line,
                body: c.body,
                start_line: c.start_line,
                side: c.side
            }))
        });

        const statusText = REVIEW_STATUS_MAP[args.event] || args.event;
        const commentInfo = args.comments?.length ? `\n**Comments:** ${args.comments.length}` : '';

        return {
            content: [{
                type: 'text',
                text: `Review submitted!\n\n**Status:** ${statusText}\n**ID:** ${review.id}${commentInfo}`
            }]
        };
    }

    private getDefaultBody(event: string): string {
        const bodies: Record<string, string> = {
            'APPROVE': 'Changes look good. Approved.',
            'REQUEST_CHANGES': 'Changes required before merge.',
            'COMMENT': 'Review comments added.',
            'PENDING': 'Draft review.'
        };
        return bodies[event] || 'Review submitted.';
    }
}
