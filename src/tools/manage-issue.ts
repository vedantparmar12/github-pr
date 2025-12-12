import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';
import { PRIORITY_LABELS } from '../constants';

const logger = createLogger('ManageIssueTool');

const ManageIssueSchema = z.object({
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name'),
    action: z.enum(['create', 'update', 'close']).describe('Action to perform'),
    issue_number: z.number().optional().describe('Issue number (required for update/close)'),
    title: z.string().optional().describe('Issue title (required for create)'),
    body: z.string().optional().describe('Issue body/description'),
    state: z.enum(['open', 'closed']).optional().describe('Issue state'),
    state_reason: z.enum(['completed', 'not_planned', 'reopened']).optional().describe('Reason for state change'),
    labels: z.array(z.string()).optional().describe('Labels to set'),
    assignees: z.array(z.string()).optional().describe('Assignees to set'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional().describe('Priority level'),
    comment: z.string().optional().describe('Comment to add when closing')
});

type ManageIssueInput = z.infer<typeof ManageIssueSchema>;

export class ManageIssueTool implements MCPTool {
    name = 'manage-issue';
    description = 'Create, update, or close GitHub issues with a single unified tool';
    inputSchema = ManageIssueSchema;

    constructor(private githubClient: GitHubClient) { }

    async handler(args: ManageIssueInput): Promise<ToolResponse> {
        try {
            logger.info({ owner: args.owner, repo: args.repo, action: args.action }, 'Managing issue');

            switch (args.action) {
                case 'create': return this.createIssue(args);
                case 'update': return this.updateIssue(args);
                case 'close': return this.closeIssue(args);
                default: return { content: [{ type: 'text', text: 'Invalid action' }], isError: true };
            }
        } catch (error) {
            logger.error({ error }, 'Failed to manage issue');
            return handleError(error, 'manage-issue');
        }
    }

    private async createIssue(args: ManageIssueInput): Promise<ToolResponse> {
        if (!args.title) {
            return { content: [{ type: 'text', text: 'Title is required for create action' }], isError: true };
        }

        let formattedBody = args.body || '';
        if (args.priority) {
            formattedBody = `**Priority:** ${PRIORITY_LABELS[args.priority]}\n\n${formattedBody}`;
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

    private async updateIssue(args: ManageIssueInput): Promise<ToolResponse> {
        if (!args.issue_number) {
            return { content: [{ type: 'text', text: 'issue_number is required for update action' }], isError: true };
        }

        const updateParams: Record<string, any> = {};
        if (args.title !== undefined) updateParams.title = args.title;
        if (args.body !== undefined) updateParams.body = args.body;
        if (args.state !== undefined) updateParams.state = args.state;
        if (args.state_reason !== undefined) updateParams.state_reason = args.state_reason;
        if (args.labels !== undefined) updateParams.labels = args.labels;
        if (args.assignees !== undefined) updateParams.assignees = args.assignees;

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

    private async closeIssue(args: ManageIssueInput): Promise<ToolResponse> {
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
