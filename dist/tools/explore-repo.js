"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExploreRepoTool = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const constants_1 = require("../constants");
const logger = (0, logger_1.createLogger)('ExploreRepoTool');
const ExploreRepoSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner'),
    repo: zod_1.z.string().describe('Repository name'),
    path: zod_1.z.string().optional().default('').describe('Path to explore (empty for root)'),
    ref: zod_1.z.string().optional().describe('Branch, tag, or commit SHA (default: main branch)'),
    depth: zod_1.z.number().optional().default(2).describe('Directory depth to explore (1-5)')
});
class ExploreRepoTool {
    githubClient;
    name = 'explore-repo';
    description = 'Explore repository structure with tree view, language breakdown, and file statistics';
    inputSchema = ExploreRepoSchema;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            logger.info({ owner: args.owner, repo: args.repo, path: args.path }, 'Exploring repository');
            const depth = Math.min(Math.max(args.depth || 2, 1), 5);
            const tree = await this.buildTree(args.owner, args.repo, args.path || '', args.ref, depth);
            const stats = this.calculateStats(tree);
            const output = this.formatOutput(args, tree, stats);
            return { content: [{ type: 'text', text: output }] };
        }
        catch (error) {
            logger.error({ error }, 'Failed to explore repository');
            return (0, error_handler_1.handleError)(error, 'explore-repo');
        }
    }
    async buildTree(owner, repo, path, ref, maxDepth, currentDepth = 0) {
        if (currentDepth >= maxDepth)
            return [];
        const octokit = this.githubClient.octokit;
        const { data } = await octokit.repos.getContent({ owner, repo, path, ref });
        const items = Array.isArray(data) ? data : [data];
        const nodes = [];
        const sortedItems = [...items].sort((a, b) => {
            if (a.type === 'dir' && b.type !== 'dir')
                return -1;
            if (a.type !== 'dir' && b.type === 'dir')
                return 1;
            return a.name.localeCompare(b.name);
        });
        for (const item of sortedItems) {
            const node = {
                name: item.name,
                path: item.path,
                type: item.type === 'dir' ? 'dir' : 'file',
                size: item.size || 0,
                extension: item.type === 'file' ? this.getExtension(item.name) : undefined
            };
            if (item.type === 'dir' && currentDepth + 1 < maxDepth) {
                try {
                    node.children = await this.buildTree(owner, repo, item.path, ref, maxDepth, currentDepth + 1);
                }
                catch {
                    node.children = [];
                }
            }
            nodes.push(node);
        }
        return nodes;
    }
    getExtension(filename) {
        const lastDot = filename.lastIndexOf('.');
        return lastDot > 0 ? filename.substring(lastDot).toLowerCase() : '';
    }
    calculateStats(tree) {
        const stats = {
            totalFiles: 0,
            totalDirs: 0,
            totalSize: 0,
            byExtension: new Map(),
            byCategory: new Map()
        };
        const queue = [...tree];
        while (queue.length > 0) {
            const node = queue.shift();
            if (node.type === 'file') {
                stats.totalFiles++;
                stats.totalSize += node.size || 0;
                const ext = node.extension || 'no-ext';
                const extStats = stats.byExtension.get(ext) || { count: 0, size: 0 };
                extStats.count++;
                extStats.size += node.size || 0;
                stats.byExtension.set(ext, extStats);
                const category = constants_1.EXTENSION_CATEGORY_MAP.get(ext) || 'Other';
                stats.byCategory.set(category, (stats.byCategory.get(category) || 0) + 1);
            }
            else {
                stats.totalDirs++;
                if (node.children)
                    queue.push(...node.children);
            }
        }
        return stats;
    }
    formatOutput(args, tree, stats) {
        const lines = [];
        lines.push(`# Repository: ${args.owner}/${args.repo}`);
        lines.push(`**Path:** ${args.path || '/'}`);
        if (args.ref)
            lines.push(`**Ref:** ${args.ref}`);
        lines.push('');
        lines.push('## Summary');
        lines.push(`- **Files:** ${stats.totalFiles}`);
        lines.push(`- **Directories:** ${stats.totalDirs}`);
        lines.push(`- **Total Size:** ${this.formatSize(stats.totalSize)}`);
        lines.push('');
        if (stats.byCategory.size > 0) {
            lines.push('## By Category');
            const sorted = [...stats.byCategory.entries()].sort((a, b) => b[1] - a[1]);
            for (const [cat, count] of sorted.slice(0, 10)) {
                lines.push(`- **${cat}:** ${count} files`);
            }
            lines.push('');
        }
        if (stats.byExtension.size > 0) {
            lines.push('## By Extension');
            const sorted = [...stats.byExtension.entries()].sort((a, b) => b[1].count - a[1].count);
            for (const [ext, data] of sorted.slice(0, 10)) {
                lines.push(`- \`${ext || 'no-ext'}\`: ${data.count} files (${this.formatSize(data.size)})`);
            }
            lines.push('');
        }
        lines.push('## Directory Tree');
        lines.push('```');
        this.renderTree(tree, lines, '');
        lines.push('```');
        return lines.join('\n');
    }
    renderTree(nodes, lines, prefix) {
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            const isLastNode = i === nodes.length - 1;
            const connector = isLastNode ? '└── ' : '├── ';
            lines.push(`${prefix}${connector}${node.name}`);
            if (node.children && node.children.length > 0) {
                const newPrefix = prefix + (isLastNode ? '    ' : '│   ');
                this.renderTree(node.children, lines, newPrefix);
            }
        }
    }
    formatSize(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
exports.ExploreRepoTool = ExploreRepoTool;
//# sourceMappingURL=explore-repo.js.map