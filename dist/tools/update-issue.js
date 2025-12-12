"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateIssueTool = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const logger = (0, logger_1.createLogger)('UpdateIssueTool');
const UpdateIssueInputSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner (username or organization)'),
    repo: zod_1.z.string().describe('Repository name'),
    issue_number: zod_1.z.number().describe('Issue number to update'),
    title: zod_1.z.string().optional().describe('New issue title (optional)'),
    body: zod_1.z.string().optional().describe('New issue body/description (optional)'),
    state: zod_1.z.enum(['open', 'closed']).optional().describe('Issue state (optional)'),
    state_reason: zod_1.z.enum(['completed', 'not_planned', 'reopened']).optional().describe('Reason for state change (optional)'),
    assignees: zod_1.z.array(zod_1.z.string()).optional().describe('List of usernames to assign to the issue (replaces existing)'),
    milestone: zod_1.z.number().nullable().optional().describe('Milestone number to associate with the issue (use null to remove)'),
    labels: zod_1.z.array(zod_1.z.string()).optional().describe('List of labels to add to the issue (replaces existing)')
});
class UpdateIssueTool {
    githubClient;
    name = 'update-issue';
    description = 'Update an existing GitHub issue including title, body, state, assignees, labels, and milestone';
    inputSchema = UpdateIssueInputSchema;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            logger.info({
                owner: args.owner,
                repo: args.repo,
                issue_number: args.issue_number,
                updates: Object.keys(args).filter(key => key !== 'owner' && key !== 'repo' && key !== 'issue_number' && args[key] !== undefined)
            }, 'Updating GitHub issue');
            const updateParams = {};
            if (args.title !== undefined)
                updateParams.title = args.title;
            if (args.body !== undefined)
                updateParams.body = args.body;
            if (args.state !== undefined)
                updateParams.state = args.state;
            if (args.state_reason !== undefined)
                updateParams.state_reason = args.state_reason;
            if (args.assignees !== undefined)
                updateParams.assignees = args.assignees;
            if (args.milestone !== undefined)
                updateParams.milestone = args.milestone;
            if (args.labels !== undefined)
                updateParams.labels = args.labels;
            if (Object.keys(updateParams).length === 0) {
                throw new Error('At least one field must be provided to update the issue');
            }
            const updatedIssue = await this.githubClient.updateIssue({
                owner: args.owner,
                repo: args.repo,
                issue_number: args.issue_number,
                ...updateParams
            });
            const issueUrl = `https://github.com/${args.owner}/${args.repo}/issues/${updatedIssue.number}`;
            // Build update summary
            const updates = [];
            if (args.title !== undefined)
                updates.push(`title updated`);
            if (args.body !== undefined)
                updates.push(`description updated`);
            if (args.state !== undefined)
                updates.push(`state changed to ${args.state}`);
            if (args.state_reason !== undefined)
                updates.push(`state reason set to ${args.state_reason}`);
            if (args.assignees !== undefined)
                updates.push(`assignees updated (${args.assignees.length} assigned)`);
            if (args.milestone !== undefined) {
                updates.push(args.milestone === null ? 'milestone removed' : `milestone updated`);
            }
            if (args.labels !== undefined)
                updates.push(`labels updated (${args.labels.length} labels)`);
            const updateSummary = updates.join(', ');
            return {
                content: [{
                        type: 'text',
                        text: `Issue updated successfully!\n\n**Issue #${updatedIssue.number}**: ${updatedIssue.title}\n**URL**: ${issueUrl}\n**State**: ${updatedIssue.state}\n**Updates**: ${updateSummary}\n**Last Modified**: ${new Date(updatedIssue.updated_at).toLocaleString()}\n\nThe issue has been updated and is ready for continued collaboration.`
                    }],
                isError: false
            };
        }
        catch (error) {
            logger.error({ error, args }, 'Failed to update issue');
            return (0, error_handler_1.handleError)(error, 'update-issue');
        }
    }
}
exports.UpdateIssueTool = UpdateIssueTool;
//# sourceMappingURL=update-issue.js.map