"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateIssueTool = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const constants_1 = require("../constants");
const logger = (0, logger_1.createLogger)('CreateIssueTool');
const CreateIssueInputSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner (username or organization)'),
    repo: zod_1.z.string().describe('Repository name'),
    title: zod_1.z.string().min(1).describe('Issue title (required)'),
    body: zod_1.z.string().optional().describe('Issue body/description (optional)'),
    assignees: zod_1.z.array(zod_1.z.string()).optional().describe('List of usernames to assign to the issue'),
    milestone: zod_1.z.number().optional().describe('Milestone number to associate with the issue'),
    labels: zod_1.z.array(zod_1.z.string()).optional().describe('List of labels to add to the issue'),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Issue priority level')
});
class CreateIssueTool {
    githubClient;
    name = 'create-issue';
    description = 'Create a new GitHub issue in a professional format with proper structure and optional metadata';
    inputSchema = CreateIssueInputSchema;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            logger.info({
                owner: args.owner,
                repo: args.repo,
                title: args.title
            }, 'Creating GitHub issue');
            let formattedBody = args.body || '';
            if (args.priority) {
                formattedBody = `**Priority:** ${constants_1.PRIORITY_LABELS[args.priority]}\n\n${formattedBody}`;
            }
            if (formattedBody && !formattedBody.includes('## ') && formattedBody.length > 50) {
                const originalBody = formattedBody;
                formattedBody = `## Description\n\n${originalBody}\n\n## Acceptance Criteria\n\n- [ ] To be defined\n\n## Additional Notes\n\n_Please add any additional context or requirements._`;
            }
            const issueData = await this.githubClient.createIssue({
                owner: args.owner,
                repo: args.repo,
                title: args.title,
                body: formattedBody,
                assignees: args.assignees,
                milestone: args.milestone,
                labels: args.labels
            });
            const issueUrl = `https://github.com/${args.owner}/${args.repo}/issues/${issueData.number}`;
            return {
                content: [{
                        type: 'text',
                        text: `Issue created successfully!\n\n**Issue #${issueData.number}**: ${issueData.title}\n**URL**: ${issueUrl}\n**State**: ${issueData.state}\n**Created**: ${new Date(issueData.created_at).toLocaleString()}\n\nThe issue has been created with a professional structure and is ready for team collaboration.`
                    }],
                isError: false
            };
        }
        catch (error) {
            logger.error({ error, args }, 'Failed to create issue');
            return (0, error_handler_1.handleError)(error, 'create-issue');
        }
    }
}
exports.CreateIssueTool = CreateIssueTool;
//# sourceMappingURL=create-issue.js.map