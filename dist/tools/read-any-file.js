"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadAnyFileTool = void 0;
const zod_1 = require("zod");
const logger_1 = require("../utils/logger");
const error_handler_1 = require("../utils/error-handler");
const chunker_1 = require("../pagination/chunker");
const pagination_1 = require("../types/pagination");
const logger = (0, logger_1.createLogger)('ReadAnyFileTool');
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS_PER_CHUNK || '4000');
const ReadAnyFileSchema = zod_1.z.object({
    owner: zod_1.z.string().describe('Repository owner'),
    repo: zod_1.z.string().describe('Repository name'),
    path: zod_1.z.string().describe('File path in repository'),
    ref: zod_1.z.string().optional().describe('Branch, tag, or commit SHA'),
    context_token: zod_1.z.string().optional().describe('Pagination token for large files')
});
class ReadAnyFileTool {
    githubClient;
    name = 'read-any-file';
    description = 'Read any file from repository with automatic chunking for large files';
    inputSchema = ReadAnyFileSchema;
    constructor(githubClient) {
        this.githubClient = githubClient;
    }
    async handler(args) {
        try {
            if (args.context_token) {
                return this.handlePagination(args.context_token);
            }
            logger.info({ owner: args.owner, repo: args.repo, path: args.path }, 'Reading file');
            const octokit = this.githubClient.octokit;
            const { data } = await octokit.repos.getContent({
                owner: args.owner,
                repo: args.repo,
                path: args.path,
                ref: args.ref
            });
            if (Array.isArray(data)) {
                return { content: [{ type: 'text', text: 'Error: Path is a directory, not a file.' }], isError: true };
            }
            if (data.type !== 'file' || !data.content) {
                return { content: [{ type: 'text', text: 'Error: Cannot read this file type.' }], isError: true };
            }
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            const lines = content.split('\n');
            const chunks = this.chunkContent(lines);
            return this.formatResponse(args, data, chunks[0], 0, chunks.length);
        }
        catch (error) {
            logger.error({ error }, 'Failed to read file');
            return (0, error_handler_1.handleError)(error, 'read-any-file');
        }
    }
    chunkContent(lines) {
        const chunks = [];
        let currentChunk = [];
        let startLine = 1;
        let currentTokens = 0;
        for (let i = 0; i < lines.length; i++) {
            const lineTokens = (0, chunker_1.estimateTokens)(lines[i]);
            if (currentTokens + lineTokens > MAX_TOKENS && currentChunk.length > 0) {
                chunks.push({
                    content: currentChunk.join('\n'),
                    startLine,
                    endLine: startLine + currentChunk.length - 1,
                    totalLines: lines.length
                });
                currentChunk = [];
                startLine = i + 1;
                currentTokens = 0;
            }
            currentChunk.push(lines[i]);
            currentTokens += lineTokens;
        }
        if (currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join('\n'),
                startLine,
                endLine: startLine + currentChunk.length - 1,
                totalLines: lines.length
            });
        }
        return chunks;
    }
    formatResponse(args, fileData, chunk, chunkIndex, totalChunks) {
        const ext = this.getExtension(args.path);
        const lang = this.getLanguage(ext);
        let output = `# File: ${args.path}\n\n`;
        output += `**Size:** ${this.formatSize(fileData.size)} | **Lines:** ${chunk.totalLines}`;
        if (args.ref)
            output += ` | **Ref:** ${args.ref}`;
        output += '\n';
        if (totalChunks > 1) {
            output += `**Chunk:** ${chunkIndex + 1}/${totalChunks} (lines ${chunk.startLine}-${chunk.endLine})\n`;
        }
        output += `\n\`\`\`${lang}\n${this.addLineNumbers(chunk.content, chunk.startLine)}\n\`\`\``;
        if (chunkIndex < totalChunks - 1) {
            const context = (0, pagination_1.encryptContext)({
                owner: args.owner,
                repo: args.repo,
                filename: args.path,
                current_chunk_index: chunkIndex,
                total_chunks: totalChunks,
                pr_number: 0,
                current_file_index: 0,
                total_files: 1
            });
            output += `\n\n---\nUse \`read-any-file\` with \`context_token\` to see next chunk.`;
        }
        return { content: [{ type: 'text', text: output }] };
    }
    async handlePagination(token) {
        try {
            const context = (0, pagination_1.decryptContext)(token);
            const nextIndex = context.current_chunk_index + 1;
            if (nextIndex >= context.total_chunks) {
                return { content: [{ type: 'text', text: 'No more chunks available.' }] };
            }
            const octokit = this.githubClient.octokit;
            const { data } = await octokit.repos.getContent({
                owner: context.owner,
                repo: context.repo,
                path: context.filename
            });
            const content = Buffer.from(data.content, 'base64').toString('utf-8');
            const chunks = this.chunkContent(content.split('\n'));
            return this.formatResponse({ owner: context.owner, repo: context.repo, path: context.filename }, data, chunks[nextIndex], nextIndex, chunks.length);
        }
        catch (error) {
            if (error.message?.includes('expired')) {
                return { content: [{ type: 'text', text: 'Token expired. Please start a new request.' }], isError: true };
            }
            throw error;
        }
    }
    addLineNumbers(content, startLine) {
        return content.split('\n').map((line, i) => `${String(startLine + i).padStart(4)} | ${line}`).join('\n');
    }
    getExtension(path) {
        const lastDot = path.lastIndexOf('.');
        return lastDot > 0 ? path.substring(lastDot).toLowerCase() : '';
    }
    getLanguage(ext) {
        const langMap = {
            '.ts': 'typescript', '.tsx': 'tsx', '.js': 'javascript', '.jsx': 'jsx',
            '.py': 'python', '.rb': 'ruby', '.go': 'go', '.rs': 'rust',
            '.java': 'java', '.kt': 'kotlin', '.cs': 'csharp', '.cpp': 'cpp',
            '.c': 'c', '.h': 'c', '.php': 'php', '.swift': 'swift',
            '.json': 'json', '.yaml': 'yaml', '.yml': 'yaml', '.xml': 'xml',
            '.html': 'html', '.css': 'css', '.scss': 'scss', '.md': 'markdown',
            '.sql': 'sql', '.sh': 'bash', '.ps1': 'powershell'
        };
        return langMap[ext] || '';
    }
    formatSize(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
}
exports.ReadAnyFileTool = ReadAnyFileTool;
//# sourceMappingURL=read-any-file.js.map