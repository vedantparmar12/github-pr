import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';

const logger = createLogger('SearchCodeTool');

const SearchCodeSchema = z.object({
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name'),
    query: z.string().describe('Search query (supports GitHub code search syntax)'),
    language: z.string().optional().describe('Filter by programming language'),
    path: z.string().optional().describe('Filter by file path'),
    extension: z.string().optional().describe('Filter by file extension'),
    page: z.number().optional().default(1).describe('Page number'),
    per_page: z.number().optional().default(10).describe('Results per page (max 30)')
});

interface SearchResult {
    path: string;
    lineNumber: number;
    content: string;
    score: number;
}

export class SearchCodeTool implements MCPTool {
    name = 'search-code';
    description = 'Search code in repository using GitHub Code Search API with language and path filters';
    inputSchema = SearchCodeSchema;

    constructor(private githubClient: GitHubClient) { }

    async handler(args: z.infer<typeof SearchCodeSchema>): Promise<ToolResponse> {
        try {
            logger.info({ owner: args.owner, repo: args.repo, query: args.query }, 'Searching code');

            const searchQuery = this.buildQuery(args);
            const octokit = (this.githubClient as any).octokit;

            const { data } = await octokit.search.code({
                q: searchQuery,
                page: args.page,
                per_page: Math.min(args.per_page || 10, 30)
            });

            const results = this.processResults(data.items);
            const grouped = this.groupByFile(results);
            const output = this.formatOutput(args, data.total_count, grouped);

            return { content: [{ type: 'text', text: output }] };
        } catch (error: any) {
            if (error.status === 403) {
                return {
                    content: [{ type: 'text', text: 'Code search rate limited. Please wait and try again.' }],
                    isError: true
                };
            }
            logger.error({ error }, 'Failed to search code');
            return handleError(error, 'search-code');
        }
    }

    private buildQuery(args: z.infer<typeof SearchCodeSchema>): string {
        const parts: string[] = [args.query, `repo:${args.owner}/${args.repo}`];

        if (args.language) parts.push(`language:${args.language}`);
        if (args.path) parts.push(`path:${args.path}`);
        if (args.extension) parts.push(`extension:${args.extension}`);

        return parts.join(' ');
    }

    private processResults(items: any[]): SearchResult[] {
        return items.map(item => ({
            path: item.path,
            lineNumber: 0,
            content: item.text_matches?.[0]?.fragment || '',
            score: item.score || 0
        }));
    }

    private groupByFile(results: SearchResult[]): Map<string, SearchResult[]> {
        const grouped = new Map<string, SearchResult[]>();

        for (const result of results) {
            const existing = grouped.get(result.path) || [];
            existing.push(result);
            grouped.set(result.path, existing);
        }

        return grouped;
    }

    private formatOutput(
        args: z.infer<typeof SearchCodeSchema>,
        totalCount: number,
        grouped: Map<string, SearchResult[]>
    ): string {
        const lines: string[] = [];

        lines.push(`# Code Search Results`);
        lines.push(`**Query:** \`${args.query}\``);
        lines.push(`**Repository:** ${args.owner}/${args.repo}`);
        if (args.language) lines.push(`**Language:** ${args.language}`);
        if (args.path) lines.push(`**Path filter:** ${args.path}`);
        lines.push(`**Total matches:** ${totalCount}`);
        lines.push(`**Page:** ${args.page}`);
        lines.push('');

        if (grouped.size === 0) {
            lines.push('No results found.');
            return lines.join('\n');
        }

        lines.push('## Matching Files');
        lines.push('');

        let fileIndex = 0;
        for (const [path, results] of grouped) {
            fileIndex++;
            lines.push(`### ${fileIndex}. \`${path}\``);

            for (const result of results) {
                if (result.content) {
                    lines.push('```');
                    lines.push(result.content.trim());
                    lines.push('```');
                }
            }
            lines.push('');
        }

        if (totalCount > (args.page || 1) * (args.per_page || 10)) {
            lines.push('---');
            lines.push(`More results available. Use \`page: ${(args.page || 1) + 1}\` to see next page.`);
        }

        return lines.join('\n');
    }
}
