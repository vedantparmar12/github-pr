"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRepoStatsTool = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const logger = (0, logger_1.createLogger)('GetRepoStatsTool');
const GetRepoStatsSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner'),
    repo: zod_1.z.string().describe('Repository name'),
    include_contributors: zod_1.z.boolean().optional().default(true).describe('Include top contributors'),
    include_languages: zod_1.z.boolean().optional().default(true).describe('Include language breakdown'),
    include_activity: zod_1.z.boolean().optional().default(true).describe('Include commit activity')
});
class GetRepoStatsTool {
    githubClient;
    name = 'get-repo-stats';
    description = 'Get comprehensive repository statistics including contributors, languages, and activity';
    inputSchema = GetRepoStatsSchema;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            logger.info({ owner: args.owner, repo: args.repo }, 'Getting repository stats');
            const octokit = this.githubClient.octokit;
            const [repoData, contributors, languages] = await Promise.all([
                octokit.repos.get({ owner: args.owner, repo: args.repo }),
                args.include_contributors ? this.getContributors(octokit, args) : null,
                args.include_languages ? this.getLanguages(octokit, args) : null
            ]);
            const repoInfo = this.extractRepoInfo(repoData.data);
            const output = this.formatOutput(args, repoInfo, contributors, languages);
            return { content: [{ type: 'text', text: output }] };
        }
        catch (error) {
            logger.error({ error }, 'Failed to get repository stats');
            return (0, error_handler_1.handleError)(error, 'get-repo-stats');
        }
    }
    async getContributors(octokit, args) {
        try {
            const { data } = await octokit.repos.listContributors({
                owner: args.owner,
                repo: args.repo,
                per_page: 10
            });
            const totalContributions = data.reduce((sum, c) => sum + c.contributions, 0);
            return data.map((c) => ({
                login: c.login,
                contributions: c.contributions,
                percentage: Math.round((c.contributions / totalContributions) * 100)
            }));
        }
        catch {
            return [];
        }
    }
    async getLanguages(octokit, args) {
        try {
            const { data } = await octokit.repos.listLanguages({
                owner: args.owner,
                repo: args.repo
            });
            const totalBytes = Object.values(data).reduce((a, b) => a + b, 0);
            return Object.entries(data)
                .map(([name, bytes]) => ({
                name,
                bytes,
                percentage: Math.round((bytes / totalBytes) * 100)
            }))
                .sort((a, b) => b.bytes - a.bytes);
        }
        catch {
            return [];
        }
    }
    extractRepoInfo(data) {
        return {
            name: data.full_name,
            description: data.description || 'No description',
            stars: data.stargazers_count,
            forks: data.forks_count,
            watchers: data.watchers_count,
            openIssues: data.open_issues_count,
            defaultBranch: data.default_branch,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            size: data.size,
            isPrivate: data.private,
            topics: data.topics || []
        };
    }
    formatOutput(_args, info, contributors, languages) {
        const lines = [];
        lines.push(`# ${info.name}`);
        lines.push(`${info.description}`);
        lines.push('');
        lines.push('## Overview');
        lines.push(`| Metric | Value |`);
        lines.push(`|--------|-------|`);
        lines.push(`| Stars | ${info.stars} |`);
        lines.push(`| Forks | ${info.forks} |`);
        lines.push(`| Open Issues | ${info.openIssues} |`);
        lines.push(`| Size | ${this.formatSize(info.size * 1024)} |`);
        lines.push(`| Default Branch | ${info.defaultBranch} |`);
        lines.push(`| Visibility | ${info.isPrivate ? 'Private' : 'Public'} |`);
        lines.push(`| Created | ${new Date(info.createdAt).toLocaleDateString()} |`);
        lines.push(`| Last Updated | ${new Date(info.updatedAt).toLocaleDateString()} |`);
        lines.push('');
        if (info.topics.length > 0) {
            lines.push('## Topics');
            lines.push(info.topics.map(t => `\`${t}\``).join(' '));
            lines.push('');
        }
        if (languages && languages.length > 0) {
            lines.push('## Languages');
            const bar = this.createLanguageBar(languages);
            lines.push(bar);
            lines.push('');
            for (const lang of languages.slice(0, 8)) {
                lines.push(`- **${lang.name}**: ${lang.percentage}% (${this.formatSize(lang.bytes)})`);
            }
            lines.push('');
        }
        if (contributors && contributors.length > 0) {
            lines.push('## Top Contributors');
            for (const c of contributors.slice(0, 10)) {
                lines.push(`- **@${c.login}**: ${c.contributions} commits (${c.percentage}%)`);
            }
            lines.push('');
        }
        return lines.join('\n');
    }
    createLanguageBar(languages) {
        const colors = ['blue', 'green', 'yellow', 'red', 'purple', 'orange', 'cyan', 'gray'];
        return languages.slice(0, 5).map((l, i) => `${l.name}: ${'█'.repeat(Math.max(1, Math.round(l.percentage / 5)))}`).join(' | ');
    }
    formatSize(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
exports.GetRepoStatsTool = GetRepoStatsTool;
//# sourceMappingURL=get-repo-stats.js.map