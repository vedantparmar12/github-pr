"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloseIssueTool = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const logger = (0, logger_1.createLogger)('CloseIssueTool');
const CloseIssueInputSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner (username or organization)'),
    repo: zod_1.z.string().describe('Repository name'),
    issue_number: zod_1.z.number().describe('Issue number to close'),
    reason: zod_1.z.enum(['completed', 'not_planned']).optional().default('completed').describe('Reason for closing the issue'),
    comment: zod_1.z.string().optional().describe('Optional comment to add when closing the issue')
});
class CloseIssueTool {
    githubClient;
    name = 'close-issue';
    description = 'Close a GitHub issue with optional reason and comment - convenient wrapper for common close operations';
    inputSchema = CloseIssueInputSchema;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            logger.info({
                owner: args.owner,
                repo: args.repo,
                issue_number: args.issue_number,
                reason: args.reason
            }, 'Closing GitHub issue');
            if (args.comment) {
                await this.githubClient.createIssueComment({
                    owner: args.owner,
                    repo: args.repo,
                    issue_number: args.issue_number,
                    body: args.comment
                });
            }
            const closedIssue = await this.githubClient.updateIssue({
                owner: args.owner,
                repo: args.repo,
                issue_number: args.issue_number,
                state: 'closed',
                state_reason: args.reason
            });
            const issueUrl = `https://github.com/${args.owner}/${args.repo}/issues/${closedIssue.number}`;
            const reasonText = args.reason === 'completed' ? 'as completed' : 'as not planned';
            const commentText = args.comment ? `\n**Closing Comment**: "${args.comment}"` : '';
            return {
                content: [{
                        type: 'text',
                        text: `Issue closed successfully!\n\n**Issue #${closedIssue.number}**: ${closedIssue.title}\n**URL**: ${issueUrl}\n**Closed**: ${reasonText}${commentText}\n**Closed At**: ${new Date(closedIssue.updated_at).toLocaleString()}\n\nThe issue has been closed and is no longer active.`
                    }],
                isError: false
            };
        }
        catch (error) {
            logger.error({ error, args }, 'Failed to close issue');
            return (0, error_handler_1.handleError)(error, 'close-issue');
        }
    }
}
exports.CloseIssueTool = CloseIssueTool;
//# sourceMappingURL=close-issue.js.map