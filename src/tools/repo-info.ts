import { z } from 'zod';
import { GitHubClient } from '../github/client';
import { MCPTool, ToolResponse } from '../types/mcp';
import { createLogger } from '../utils/logger';
import { handleError } from '../utils/error-handler';
import { EXTENSION_CATEGORY_MAP } from '../constants';

const logger = createLogger('RepoInfoTool');

const RepoInfoSchema = z.object({
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name'),
    action: z.enum(['stats', 'explore', 'both']).default('both').describe('Info type: stats, explore, or both'),
    path: z.string().optional().default('').describe('Path to explore (for explore action)'),
    ref: z.string().optional().describe('Branch, tag, or commit SHA'),
    depth: z.number().optional().default(2).describe('Directory depth to explore (1-5)')
});

type RepoInfoInput = z.infer<typeof RepoInfoSchema>;

interface TreeNode {
    name: string;
    path: string;
    type: 'file' | 'dir';
    size?: number;
    children?: TreeNode[];
}

export class RepoInfoTool implements MCPTool {
    name = 'repo-info';
    description = 'Get repository stats, explore structure, or both in one call';
    inputSchema = RepoInfoSchema;

    constructor(private githubClient: GitHubClient) { }

    async handler(args: RepoInfoInput): Promise<ToolResponse> {
        try {
            logger.info({ owner: args.owner, repo: args.repo, action: args.action }, 'Getting repo info');

            const octokit = (this.githubClient as any).octokit;
            const lines: string[] = [];

            if (args.action === 'stats' || args.action === 'both') {
                await this.addStats(octokit, args, lines);
            }

            if (args.action === 'explore' || args.action === 'both') {
                await this.addExplore(octokit, args, lines);
            }

            return { content: [{ type: 'text', text: lines.join('\n') }] };
        } catch (error) {
            logger.error({ error }, 'Failed to get repo info');
            return handleError(error, 'repo-info');
        }
    }

    private async addStats(octokit: any, args: RepoInfoInput, lines: string[]): Promise<void> {
        const [repoData, languages, contributors] = await Promise.all([
            octokit.repos.get({ owner: args.owner, repo: args.repo }),
            octokit.repos.listLanguages({ owner: args.owner, repo: args.repo }).catch(() => ({ data: {} })),
            octokit.repos.listContributors({ owner: args.owner, repo: args.repo, per_page: 5 }).catch(() => ({ data: [] }))
        ]);

        const repo = repoData.data;
        lines.push(`# ${repo.full_name}`);
        lines.push(repo.description || 'No description');
        lines.push('');
        lines.push('## Overview');
        lines.push(`| Metric | Value |`);
        lines.push(`|--------|-------|`);
        lines.push(`| Stars | ${repo.stargazers_count} |`);
        lines.push(`| Forks | ${repo.forks_count} |`);
        lines.push(`| Issues | ${repo.open_issues_count} |`);
        lines.push(`| Branch | ${repo.default_branch} |`);
        lines.push('');

        if (Object.keys(languages.data).length > 0) {
            const total = Object.values(languages.data as Record<string, number>).reduce((a, b) => a + b, 0);
            lines.push('## Languages');
            for (const [lang, bytes] of Object.entries(languages.data as Record<string, number>).slice(0, 5)) {
                lines.push(`- **${lang}**: ${Math.round((bytes / total) * 100)}%`);
            }
            lines.push('');
        }

        if (contributors.data.length > 0) {
            lines.push('## Top Contributors');
            for (const c of contributors.data.slice(0, 5)) {
                lines.push(`- @${c.login}: ${c.contributions} commits`);
            }
            lines.push('');
        }
    }

    private async addExplore(octokit: any, args: RepoInfoInput, lines: string[]): Promise<void> {
        const depth = Math.min(Math.max(args.depth || 2, 1), 5);
        const tree = await this.buildTree(octokit, args.owner, args.repo, args.path || '', args.ref, depth);
        const stats = this.calculateStats(tree);

        lines.push('## Directory Structure');
        lines.push(`**Files:** ${stats.files} | **Dirs:** ${stats.dirs}`);
        lines.push('');

        if (stats.byCategory.size > 0) {
            lines.push('### By Category');
            for (const [cat, count] of [...stats.byCategory.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)) {
                lines.push(`- ${cat}: ${count}`);
            }
            lines.push('');
        }

        lines.push('### Tree');
        lines.push('```');
        this.renderTree(tree, lines, '');
        lines.push('```');
    }

    private async buildTree(octokit: any, owner: string, repo: string, path: string, ref: string | undefined, maxDepth: number, currentDepth: number = 0): Promise<TreeNode[]> {
        if (currentDepth >= maxDepth) return [];

        const { data } = await octokit.repos.getContent({ owner, repo, path, ref });
        const items = Array.isArray(data) ? data : [data];

        const nodes: TreeNode[] = [];
        const sorted = [...items].sort((a, b) => (a.type === 'dir' ? -1 : 1) - (b.type === 'dir' ? -1 : 1) || a.name.localeCompare(b.name));

        for (const item of sorted) {
            const node: TreeNode = { name: item.name, path: item.path, type: item.type === 'dir' ? 'dir' : 'file', size: item.size };
            if (item.type === 'dir' && currentDepth + 1 < maxDepth) {
                try { node.children = await this.buildTree(octokit, owner, repo, item.path, ref, maxDepth, currentDepth + 1); } catch { node.children = []; }
            }
            nodes.push(node);
        }
        return nodes;
    }

    private calculateStats(tree: TreeNode[]): { files: number; dirs: number; byCategory: Map<string, number> } {
        const stats = { files: 0, dirs: 0, byCategory: new Map<string, number>() };
        const queue = [...tree];

        while (queue.length > 0) {
            const node = queue.shift()!;
            if (node.type === 'file') {
                stats.files++;
                const ext = node.name.includes('.') ? node.name.substring(node.name.lastIndexOf('.')).toLowerCase() : '';
                const cat = EXTENSION_CATEGORY_MAP.get(ext) || 'Other';
                stats.byCategory.set(cat, (stats.byCategory.get(cat) || 0) + 1);
            } else {
                stats.dirs++;
                if (node.children) queue.push(...node.children);
            }
        }
        return stats;
    }

    private renderTree(nodes: TreeNode[], lines: string[], prefix: string): void {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const isLast = i === nodes.length - 1;
            lines.push(`${prefix}${isLast ? '└── ' : '├── '}${node.name}`);
            if (node.children?.length) this.renderTree(node.children, lines, prefix + (isLast ? '    ' : '│   '));
        }
    }
}
