import { MCPTool, ToolResponse, ListFilesInput, ListFilesSchema } from '../types/mcp';
import { GitHubClient } from '../github/client';
import { createLogger } from '../utils/logger';
import { FileDiff } from '../types/github';
import { FILE_STATUS_BADGES } from '../constants';

const logger = createLogger('ListFilesTool');

export class ListFilesTool implements MCPTool {
  name = 'list-files';
  description = 'List all files changed in a pull request with pagination support';
  inputSchema = ListFilesSchema;

  private githubClient: GitHubClient;

  constructor(githubClient: GitHubClient) {
    this.githubClient = githubClient;
  }

  async handler(args: unknown): Promise<ToolResponse> {
    const input = this.inputSchema.parse(args) as ListFilesInput;

    logger.info({
      owner: input.owner,
      repo: input.repo,
      pr_number: input.pr_number,
      page: input.page,
      per_page: input.per_page
    }, 'Listing pull request files');

    const { files, hasMore } = await this.githubClient.listPullRequestFiles(
      input.owner,
      input.repo,
      input.pr_number,
      input.page,
      input.per_page
    );

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

  private groupFilesByDirectory(files: FileDiff[]): Map<string, FileDiff[]> {
    const grouped = new Map<string, FileDiff[]>();

    for (const file of files) {
      const dir = file.filename.includes('/')
        ? file.filename.substring(0, file.filename.lastIndexOf('/'))
        : '.';

      if (!grouped.has(dir)) {
        grouped.set(dir, []);
      }
      grouped.get(dir)!.push(file);
    }

    return new Map([...grouped.entries()].sort());
  }

  private getStatusSummary(files: FileDiff[]): string {
    const statusCounts = new Map<string, number>();

    for (const file of files) {
      statusCounts.set(file.status, (statusCounts.get(file.status) || 0) + 1);
    }

    return Array.from(statusCounts.entries())
      .map(([status, count]) => `- **${status}**: ${count} files`)
      .join('\n');
  }

  private formatGroupedFiles(grouped: Map<string, FileDiff[]>): string {
    const lines: string[] = [];

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

  private formatFileList(files: FileDiff[]): string {
    const lines: string[] = [];
    const maxLength = Math.max(...files.map(f => f.filename.length));

    for (const file of files) {
      const padding = ' '.repeat(maxLength - file.filename.length);
      const stats = `+${file.additions.toString().padStart(4)} -${file.deletions.toString().padStart(4)}`;
      lines.push(`${file.filename}${padding}  ${stats}  [${file.status}]`);
    }

    return lines.join('\n');
  }

  private getStatusBadge(status: string): string {
    return FILE_STATUS_BADGES[status] || '[?]';
  }
}
