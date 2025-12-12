"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubmitReviewTool = void 0;
const mcp_1 = require("../types/mcp");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
const logger = (0, logger_1.createLogger)('SubmitReviewTool');
class SubmitReviewTool {
    name = 'submit-review';
    description = 'Submit a complete review with approval status and optional inline comments';
    inputSchema = mcp_1.SubmitReviewSchema;
    githubClient;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            const input = this.inputSchema.parse(args);
            logger.info({
                owner: input.owner,
                repo: input.repo,
                pr_number: input.pr_number,
                event: input.event,
                comments_count: input.comments?.length || 0
            }, 'Submitting review');
            if (!input.body && (!input.comments || input.comments.length === 0)) {
                input.body = this.generateDefaultBody(input.event);
            }
            const review = await this.githubClient.createReview({
                owner: input.owner,
                repo: input.repo,
                pull_number: input.pr_number,
                body: input.body || '',
                event: input.event,
                comments: input.comments
            });
            const statusText = this.getStatusText(review.state);
            const output = this.generateReviewOutput(review, input, statusText);
            return {
                content: [{
                        type: 'text',
                        text: output
                    }]
            };
        }
        catch (error) {
            logger.error({ error }, 'Failed to submit review');
            let errorMessage = 'Failed to submit review';
            if (error.message?.includes('validation')) {
                errorMessage = 'Invalid review data. Please check your input parameters.';
            }
            else if (error.message?.includes('404')) {
                errorMessage = 'Pull request not found. Please verify the repository and PR number.';
            }
            else if (error.message?.includes('401') || error.message?.includes('403')) {
                errorMessage = 'Authentication failed. Please check your GitHub token permissions.';
            }
            else if (error.message?.includes('422')) {
                errorMessage = 'The review could not be created. This might be because the PR is closed or you are trying to review your own PR.';
            }
            else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            return {
                content: [{
                        type: 'text',
                        text: `## Review Submission Failed\n\n${errorMessage}\n\nPlease check the logs for more details.`
                    }],
                isError: true
            };
        }
    }
    generateDefaultBody(event) {
        switch (event) {
            case 'APPROVE':
                return 'The changes look good to me. Approved.';
            case 'REQUEST_CHANGES':
                return 'This pull request requires changes before it can be merged.';
            case 'COMMENT':
                return 'I have reviewed the changes and left comments.';
            default:
                return 'Review submitted.';
        }
    }
    generateReviewOutput(review, input, statusText) {
        let output = `## Review Submitted Successfully\n\n`;
        output += `**Review ID:** ${review.id}\n`;
        output += `**Status:** ${statusText}\n`;
        output += `**Reviewer:** @${review.user.login}\n`;
        output += `**Submitted:** ${review.submitted_at ? new Date(review.submitted_at).toLocaleString() : 'Just now'}\n\n`;
        if (review.body) {
            output += '### Review Summary\n\n';
            output += `${review.body}\n\n`;
        }
        if (input.comments && input.comments.length > 0) {
            output += '### Inline Comments Added\n\n';
            output += `This review includes ${input.comments.length} inline comment${input.comments.length !== 1 ? 's' : ''}:\n\n`;
            input.comments.forEach((comment, index) => {
                const lineInfo = comment.start_line
                    ? `lines ${comment.start_line}-${comment.line || comment.start_line}`
                    : `line ${comment.line || 'N/A'}`;
                output += `${index + 1}. **${comment.path}** (${lineInfo})\n`;
                output += `   > ${comment.body.split('\n')[0]}${comment.body.includes('\n') ? '...' : ''}\n\n`;
            });
        }
        output += '---\n';
        output += `The review has been successfully submitted to PR #${input.pr_number}.`;
        if (input.event === 'APPROVE') {
            output += '\n\nThis approval allows the PR to be merged if all other requirements are met.';
        }
        else if (input.event === 'REQUEST_CHANGES') {
            output += '\n\nThe author needs to address the requested changes before this PR can be merged.';
        }
        return output;
    }
    getStatusText(state) {
        return constants_1.REVIEW_STATUS_MAP[state] || state;
    }
}
exports.SubmitReviewTool = SubmitReviewTool;
//# sourceMappingURL=submit-review.js.map