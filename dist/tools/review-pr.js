"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewPRTool = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const constants_1 = require("../constants");
const logger = (0, logger_1.createLogger)('ReviewPRTool');
const ReviewPRSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner'),
    repo: zod_1.z.string().describe('Repository name'),
    pr_number: zod_1.z.number().describe('Pull request number'),
    action: zod_1.z.enum(['comment', 'submit']).describe('Action: add inline comment or submit review'),
    path: zod_1.z.string().optional().describe('File path for inline comment'),
    line: zod_1.z.number().optional().describe('Line number for inline comment'),
    start_line: zod_1.z.number().optional().describe('Start line for multi-line comment'),
    side: zod_1.z.enum(['LEFT', 'RIGHT']).optional().default('RIGHT').describe('Diff side'),
    body: zod_1.z.string().optional().describe('Comment or review body'),
    event: zod_1.z.enum(['APPROVE', 'REQUEST_CHANGES', 'COMMENT', 'PENDING']).optional().describe('Review decision'),
    comments: zod_1.z.array(zod_1.z.object({
        path: zod_1.z.string(),
        line: zod_1.z.number(),
        body: zod_1.z.string(),
        start_line: zod_1.z.number().optional(),
        side: zod_1.z.enum(['LEFT', 'RIGHT']).optional()
    })).optional().describe('Batch inline comments with review')
});
class ReviewPRTool {
    githubClient;
    name = 'review-pr';
    description = 'Add inline comments or submit a full review on a pull request';
    inputSchema = ReviewPRSchema;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            logger.info({ owner: args.owner, repo: args.repo, pr_number: args.pr_number, action: args.action }, 'Reviewing PR');
            if (args.action === 'comment')
                return this.addComment(args);
            if (args.action === 'submit')
                return this.submitReview(args);
            return { content: [{ type: 'text', text: 'Invalid action' }], isError: true };
        }
        catch (error) {
            logger.error({ error }, 'Failed to review PR');
            return (0, error_handler_1.handleError)(error, 'review-pr');
        }
    }
    async addComment(args) {
        if (!args.path || !args.line || !args.body) {
            return { content: [{ type: 'text', text: 'path, line, and body are required for comment action' }], isError: true };
        }
        const comment = await this.githubClient.createReviewComment(args.owner, args.repo, args.pr_number, { path: args.path, line: args.line, start_line: args.start_line, side: args.side, body: args.body });
        return {
            content: [{
                    type: 'text',
                    text: `Comment added!\n\n**File:** ${comment.path}\n**Line:** ${comment.line}\n**Author:** @${comment.user.login}\n\n> ${comment.body}`
                }]
        };
    }
    async submitReview(args) {
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
        const statusText = constants_1.REVIEW_STATUS_MAP[args.event] || args.event;
        const commentInfo = args.comments?.length ? `\n**Comments:** ${args.comments.length}` : '';
        return {
            content: [{
                    type: 'text',
                    text: `Review submitted!\n\n**Status:** ${statusText}\n**ID:** ${review.id}${commentInfo}`
                }]
        };
    }
    getDefaultBody(event) {
        const bodies = {
            'APPROVE': 'Changes look good. Approved.',
            'REQUEST_CHANGES': 'Changes required before merge.',
            'COMMENT': 'Review comments added.',
            'PENDING': 'Draft review.'
        };
        return bodies[event] || 'Review submitted.';
    }
}
exports.ReviewPRTool = ReviewPRTool;
//# sourceMappingURL=review-pr.js.map