"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListFilesTool = void 0;
const mcp_1 = require("../types/mcp");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
const logger = (0, logger_1.createLogger)('ListFilesTool');
class ListFilesTool {
    name = 'list-files';
    description = 'List all files changed in a pull request with pagination support';
    inputSchema = mcp_1.ListFilesSchema;
    githubClient;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        const input = this.inputSchema.parse(args);
        logger.info({
            owner: input.owner,
            repo: input.repo,
            pr_number: input.pr_number,
            page: input.page,
            per_page: input.per_page
        }, 'Listing pull request files');
        const { files, hasMore } = await this.githubClient.listPullRequestFiles(input.owner, input.repo, input.pr_number, input.page, input.per_page);
        const groupedFiles = this.groupFilesByDirectory(files);
        const output = `# Changed Files (Page ${input.page})

Total files on this page: ${files.length}
${hasMore ? `More files available - use page=${input.page + 1} to see next page` : 'No more files'}

## Summary by Status
${this.getStatusSummary(files)}

## Files by Directory
${this.formatGroupedFiles(groupedFiles)}

## Detailed Changes
\`\`\`
${this.formatFileList(files)}
\`\`\`

---
Use \`read-file\` with a specific filename to examine the changes in detail.`;
        return {
            content: [{
                    type: 'text',
                    text: output
                }]
        };
    }
    groupFilesByDirectory(files) {
        const grouped = new Map();
        for (const file of files) {
            const dir = file.filename.includes('/')
                ? file.filename.substring(0, file.filename.lastIndexOf('/'))
                : '.';
            if (!grouped.has(dir)) {
                grouped.set(dir, []);
            }
            grouped.get(dir).push(file);
        }
        return new Map([...grouped.entries()].sort());
    }
    getStatusSummary(files) {
        const statusCounts = new Map();
        for (const file of files) {
            statusCounts.set(file.status, (statusCounts.get(file.status) || 0) + 1);
        }
        return Array.from(statusCounts.entries())
            .map(([status, count]) => `- **${status}**: ${count} files`)
            .join('\n');
    }
    formatGroupedFiles(grouped) {
        const lines = [];
        for (const [dir, files] of grouped) {
            lines.push(`### ${dir}/`);
            for (const file of files) {
                const filename = file.filename.substring(dir.length + 1);
                const badge = this.getStatusBadge(file.status);
                const stats = `+${file.additions} -${file.deletions}`;
                lines.push(`  - ${badge} ${filename} (${stats})`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    formatFileList(files) {
        const lines = [];
        const maxLength = Math.max(...files.map(f => f.filename.length));
        for (const file of files) {
            const padding = ' '.repeat(maxLength - file.filename.length);
            const stats = `+${file.additions.toString().padStart(4)} -${file.deletions.toString().padStart(4)}`;
            lines.push(`${file.filename}${padding}  ${stats}  [${file.status}]`);
        }
        return lines.join('\n');
    }
    getStatusBadge(status) {
        return constants_1.FILE_STATUS_BADGES[status] || '[?]';
    }
}
exports.ListFilesTool = ListFilesTool;
//# sourceMappingURL=list-files.js.map