"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManageIssueTool = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const constants_1 = require("../constants");
const logger = (0, logger_1.createLogger)('ManageIssueTool');
const ManageIssueSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner'),
    repo: zod_1.z.string().describe('Repository name'),
    action: zod_1.z.enum(['create', 'update', 'close']).describe('Action to perform'),
    issue_number: zod_1.z.number().optional().describe('Issue number (required for update/close)'),
    title: zod_1.z.string().optional().describe('Issue title (required for create)'),
    body: zod_1.z.string().optional().describe('Issue body/description'),
    state: zod_1.z.enum(['open', 'closed']).optional().describe('Issue state'),
    state_reason: zod_1.z.enum(['completed', 'not_planned', 'reopened']).optional().describe('Reason for state change'),
    labels: zod_1.z.array(zod_1.z.string()).optional().describe('Labels to set'),
    assignees: zod_1.z.array(zod_1.z.string()).optional().describe('Assignees to set'),
    priority: zod_1.z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Priority level'),
    comment: zod_1.z.string().optional().describe('Comment to add when closing')
});
class ManageIssueTool {
    githubClient;
    name = 'manage-issue';
    description = 'Create, update, or close GitHub issues with a single unified tool';
    inputSchema = ManageIssueSchema;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            logger.info({ owner: args.owner, repo: args.repo, action: args.action }, 'Managing issue');
            switch (args.action) {
                case 'create': return this.createIssue(args);
                case 'update': return this.updateIssue(args);
                case 'close': return this.closeIssue(args);
                default: return { content: [{ type: 'text', text: 'Invalid action' }], isError: true };
            }
        }
        catch (error) {
            logger.error({ error }, 'Failed to manage issue');
            return (0, error_handler_1.handleError)(error, 'manage-issue');
        }
    }
    async createIssue(args) {
        if (!args.title) {
            return { content: [{ type: 'text', text: 'Title is required for create action' }], isError: true };
        }
        let formattedBody = args.body || '';
        if (args.priority) {
            formattedBody = `**Priority:** ${constants_1.PRIORITY_LABELS[args.priority]}\n\n${formattedBody}`;
        }
        if (formattedBody && !formattedBody.includes('## ') && formattedBody.length > 50) {
            formattedBody = `## Description\n\n${formattedBody}\n\n## Acceptance Criteria\n\n- [ ] To be defined`;
        }
        const issue = await this.githubClient.createIssue({
            owner: args.owner,
            repo: args.repo,
            title: args.title,
            body: formattedBody,
            labels: args.labels,
            assignees: args.assignees
        });
        const url = `https://github.com/${args.owner}/${args.repo}/issues/${issue.number}`;
        return {
            content: [{
                    type: 'text',
                    text: `Issue created successfully!\n\n**Issue #${issue.number}**: ${issue.title}\n**URL**: ${url}\n**State**: ${issue.state}`
                }]
        };
    }
    async updateIssue(args) {
        if (!args.issue_number) {
            return { content: [{ type: 'text', text: 'issue_number is required for update action' }], isError: true };
        }
        const updateParams = {};
        if (args.title !== undefined)
            updateParams.title = args.title;
        if (args.body !== undefined)
            updateParams.body = args.body;
        if (args.state !== undefined)
            updateParams.state = args.state;
        if (args.state_reason !== undefined)
            updateParams.state_reason = args.state_reason;
        if (args.labels !== undefined)
            updateParams.labels = args.labels;
        if (args.assignees !== undefined)
            updateParams.assignees = args.assignees;
        if (Object.keys(updateParams).length === 0) {
            return { content: [{ type: 'text', text: 'At least one field must be provided to update' }], isError: true };
        }
        const issue = await this.githubClient.updateIssue({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issue_number,
            ...updateParams
        });
        const url = `https://github.com/${args.owner}/${args.repo}/issues/${issue.number}`;
        return {
            content: [{
                    type: 'text',
                    text: `Issue updated successfully!\n\n**Issue #${issue.number}**: ${issue.title}\n**URL**: ${url}\n**State**: ${issue.state}`
                }]
        };
    }
    async closeIssue(args) {
        if (!args.issue_number) {
            return { content: [{ type: 'text', text: 'issue_number is required for close action' }], isError: true };
        }
        if (args.comment) {
            await this.githubClient.createIssueComment({
                owner: args.owner,
                repo: args.repo,
                issue_number: args.issue_number,
                body: args.comment
            });
        }
        const issue = await this.githubClient.updateIssue({
            owner: args.owner,
            repo: args.repo,
            issue_number: args.issue_number,
            state: 'closed',
            state_reason: args.state_reason || 'completed'
        });
        const url = `https://github.com/${args.owner}/${args.repo}/issues/${issue.number}`;
        const reasonText = args.state_reason === 'not_planned' ? 'as not planned' : 'as completed';
        return {
            content: [{
                    type: 'text',
                    text: `Issue closed ${reasonText}!\n\n**Issue #${issue.number}**: ${issue.title}\n**URL**: ${url}`
                }]
        };
    }
}
exports.ManageIssueTool = ManageIssueTool;
//# sourceMappingURL=manage-issue.js.map