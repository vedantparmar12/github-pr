"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPRTool = exports.CreatePRTool = void 0;
const rest_1 = require("@octokit/rest");
const logger_1 = require("../utils/logger");
const constants_1 = require("../constants");
class CreatePRTool {
    octokit;
    constructor(token) {
        this.octokit = new rest_1.Octokit({ auth: token });
    }
    async execute(args) {
        try {
            const { owner, repo, head, base, draft = false, auto_generate = true } = args;
            let { title, body } = args;
            if (auto_generate) {
                const analysis = await this.analyzeChanges(owner, repo, head, base);
                if (!title) {
                    title = this.generateProfessionalTitle(analysis);
                }
                if (!body) {
                    body = this.generateComprehensiveBody(analysis);
                }
            }
            if (!title) {
                title = `Merge ${head} into ${base}`;
            }
            const response = await this.octokit.pulls.create({
                owner,
                repo,
                title,
                head,
                base,
                body: body || '',
                draft,
            });
            logger_1.logger.info(`Created PR #${response.data.number}: ${response.data.html_url}`);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            pr_number: response.data.number,
                            url: response.data.html_url,
                            title: response.data.title,
                            body: response.data.body,
                            state: response.data.state,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to create PR:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error.message,
                        }, null, 2),
                    },
                ],
                isError: true
            };
        }
    }
    async analyzeChanges(owner, repo, head, base) {
        try {
            const comparison = await this.octokit.repos.compareCommits({
                owner,
                repo,
                base,
                head,
            });
            const fileChanges = comparison.data.files?.map(file => ({
                filename: file.filename,
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                status: file.status,
                patch: file.patch,
            })) || [];
            const commits = comparison.data.commits.map(commit => ({
                sha: commit.sha.substring(0, 7),
                message: commit.commit.message,
                author: commit.commit.author?.name || 'Unknown',
                date: commit.commit.author?.date || '',
            }));
            const categories = this.categorizeFiles(fileChanges);
            const commitTypes = this.analyzeCommitTypes(commits);
            const codePatterns = this.analyzeCodePatterns(fileChanges);
            const impactAnalysis = this.analyzeImpact(fileChanges, codePatterns);
            const features = this.extractFeatures(commits, fileChanges);
            const technicalChanges = this.analyzeTechnicalChanges(fileChanges);
            const dependencies = this.analyzeDependencies(fileChanges);
            return {
                fileChanges,
                commits,
                categories,
                commitTypes,
                codePatterns,
                impactAnalysis,
                features,
                technicalChanges,
                dependencies,
                stats: {
                    filesChanged: fileChanges.length,
                    additions: fileChanges.reduce((sum, f) => sum + f.additions, 0),
                    deletions: fileChanges.reduce((sum, f) => sum + f.deletions, 0),
                    totalCommits: commits.length,
                },
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to analyze changes:', error);
            return {
                fileChanges: [],
                commits: [],
                categories: {},
                commitTypes: {},
                codePatterns: [],
                impactAnalysis: {},
                features: [],
                technicalChanges: {},
                dependencies: { added: [], removed: [], updated: [] },
                stats: {
                    filesChanged: 0,
                    additions: 0,
                    deletions: 0,
                    totalCommits: 0,
                },
            };
        }
    }
    categorizeFiles(files) {
        const categories = {};
        for (const file of files) {
            let category = 'Other Files';
            const ext = file.filename.substring(file.filename.lastIndexOf('.')).toLowerCase();
            if (constants_1.EXTENSION_CATEGORY_MAP.has(ext)) {
                category = constants_1.EXTENSION_CATEGORY_MAP.get(ext);
            }
            for (const [keyword, keywordCategory] of constants_1.KEYWORD_CATEGORY_MAP) {
                if (file.filename.includes(keyword)) {
                    category = keywordCategory;
                    break;
                }
            }
            if (file.filename.match(/package\.json|yarn\.lock|package-lock\.json/)) {
                category = 'Package Dependencies';
            }
            else if (file.filename.match(/Dockerfile|docker-compose/)) {
                category = 'Docker Configuration';
            }
            if (!categories[category])
                categories[category] = [];
            categories[category].push(file);
        }
        return categories;
    }
    analyzeCommitTypes(commits) {
        const types = {
            features: [], fixes: [], refactoring: [], performance: [],
            documentation: [], testing: [], configuration: [], dependencies: [], other: []
        };
        for (const commit of commits) {
            const message = commit.message.toLowerCase();
            let matched = false;
            for (const [pattern, type] of constants_1.COMMIT_PATTERNS) {
                if (pattern.test(message)) {
                    types[type].push(commit);
                    matched = true;
                    break;
                }
            }
            if (!matched)
                types.other.push(commit);
        }
        return types;
    }
    analyzeCodePatterns(fileChanges) {
        const patterns = [];
        fileChanges.forEach(file => {
            if (!file.patch)
                return;
            if (file.patch.includes('async') || file.patch.includes('await')) {
                patterns.push({
                    pattern: 'Asynchronous Operations',
                    type: 'async-await',
                    impact: 'Changes to asynchronous code flow',
                });
            }
            if (file.patch.match(/try\s*{|catch\s*\(|finally\s*{/)) {
                patterns.push({
                    pattern: 'Error Handling',
                    type: 'exception-handling',
                    impact: 'Modified error handling logic',
                });
            }
            if (file.patch.includes('useState') || file.patch.includes('useEffect')) {
                patterns.push({
                    pattern: 'React Hooks',
                    type: 'react-hooks',
                    impact: 'State management or side effects changes',
                });
            }
            if (file.patch.match(/class\s+\w+|interface\s+\w+|type\s+\w+/)) {
                patterns.push({
                    pattern: 'Type System',
                    type: 'type-definitions',
                    impact: 'Type safety improvements or API contract changes',
                });
            }
            if (file.patch.match(/SELECT|INSERT|UPDATE|DELETE|JOIN/i)) {
                patterns.push({
                    pattern: 'Database Queries',
                    type: 'sql-queries',
                    impact: 'Database interaction changes',
                });
            }
            if (file.patch.match(/import\s+.*from|export\s+(default|{)/)) {
                patterns.push({
                    pattern: 'Module System',
                    type: 'imports-exports',
                    impact: 'Module dependency changes',
                });
            }
        });
        const uniquePatterns = patterns.filter((pattern, index, self) => index === self.findIndex(p => p.type === pattern.type));
        return uniquePatterns;
    }
    analyzeImpact(fileChanges, patterns) {
        const impact = {
            riskLevel: 'Low',
            affectedAreas: [],
            testingRequired: [],
            potentialBreaking: [],
            performanceImpact: 'Minimal',
        };
        const totalChanges = fileChanges.reduce((sum, f) => sum + f.changes, 0);
        if (totalChanges > 1000) {
            impact.riskLevel = 'High';
        }
        else if (totalChanges > 300) {
            impact.riskLevel = 'Medium';
        }
        fileChanges.forEach(file => {
            if (file.filename.includes('api')) {
                impact.affectedAreas.push('API endpoints');
                impact.testingRequired.push('API integration tests');
            }
            if (file.filename.includes('database') || file.filename.includes('model')) {
                impact.affectedAreas.push('Database layer');
                impact.testingRequired.push('Database migrations and queries');
            }
            if (file.filename.includes('auth')) {
                impact.affectedAreas.push('Authentication system');
                impact.testingRequired.push('Security and authentication flows');
                impact.riskLevel = 'High';
            }
            if (file.filename.includes('config')) {
                impact.affectedAreas.push('Application configuration');
                impact.testingRequired.push('Configuration validation');
            }
        });
        fileChanges.forEach(file => {
            if (file.status === 'removed') {
                impact.potentialBreaking.push(`Removed file: ${file.filename}`);
            }
            if (file.patch && file.patch.includes('BREAKING')) {
                impact.potentialBreaking.push(`Breaking change noted in: ${file.filename}`);
            }
        });
        const hasPerformancePatterns = patterns.some(p => p.type === 'sql-queries' || p.pattern.includes('Performance'));
        if (hasPerformancePatterns) {
            impact.performanceImpact = 'Potential performance implications - review required';
        }
        return impact;
    }
    extractFeatures(commits, fileChanges) {
        const features = [];
        commits.forEach(commit => {
            const message = commit.message;
            const featureMatch = message.match(/(?:feat|feature|add|implement)(?:\(.*?\))?:\s*(.+)/i);
            if (featureMatch) {
                features.push(featureMatch[1].trim());
            }
            const bulletPoints = message.match(/[-*]\s+(.+)/g);
            if (bulletPoints) {
                bulletPoints.forEach(point => {
                    features.push(point.replace(/^[-*]\s+/, '').trim());
                });
            }
        });
        const fileGroups = this.categorizeFiles(fileChanges);
        if (fileGroups['React Components'] && fileGroups['React Components'].length > 0) {
            const componentNames = fileGroups['React Components'].map(f => {
                const match = f.filename.match(/([A-Z][a-zA-Z]+)\.tsx?$/);
                return match ? match[1] : null;
            }).filter(Boolean);
            if (componentNames.length > 0) {
                features.push(`New React components: ${componentNames.join(', ')}`);
            }
        }
        if (fileGroups['API Services'] && fileGroups['API Services'].length > 0) {
            features.push(`API service modifications in ${fileGroups['API Services'].length} files`);
        }
        return [...new Set(features)];
    }
    analyzeTechnicalChanges(fileChanges) {
        const technical = {
            architecturalChanges: [],
            newPatterns: [],
            refactoredAreas: [],
            addedFunctionality: [],
            removedFunctionality: [],
        };
        fileChanges.forEach(file => {
            if (!file.patch)
                return;
            const newClasses = file.patch.match(/\+\s*(?:export\s+)?(?:class|interface)\s+(\w+)/g);
            if (newClasses) {
                newClasses.forEach(match => {
                    const className = match.match(/(\w+)$/)?.[0];
                    if (className) {
                        technical.architecturalChanges.push(`New ${match.includes('interface') ? 'interface' : 'class'}: ${className}`);
                    }
                });
            }
            const newFunctions = file.patch.match(/\+\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
            if (newFunctions) {
                technical.addedFunctionality.push(`New functions in ${file.filename}`);
            }
            const removedFunctions = file.patch.match(/-\s*(?:export\s+)?(?:async\s+)?function\s+(\w+)|-\s*(?:const|let)\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
            if (removedFunctions) {
                technical.removedFunctionality.push(`Removed functions from ${file.filename}`);
            }
            if (file.patch.includes('Observer') || file.patch.includes('Subject')) {
                technical.newPatterns.push('Observer pattern implementation');
            }
            if (file.patch.includes('Factory')) {
                technical.newPatterns.push('Factory pattern implementation');
            }
            if (file.patch.includes('Singleton')) {
                technical.newPatterns.push('Singleton pattern implementation');
            }
        });
        return technical;
    }
    analyzeDependencies(fileChanges) {
        const dependencies = {
            added: [],
            removed: [],
            updated: [],
        };
        const packageFile = fileChanges.find(f => f.filename === 'package.json');
        if (packageFile && packageFile.patch) {
            const addedDeps = packageFile.patch.match(/\+\s*'([^']+)':\s*'[^']+'/g);
            if (addedDeps) {
                addedDeps.forEach(dep => {
                    const match = dep.match(/'([^']+)':/);
                    if (match)
                        dependencies.added.push(match[1]);
                });
            }
            const removedDeps = packageFile.patch.match(/-\s*'([^']+)':\s*'[^']+'/g);
            if (removedDeps) {
                removedDeps.forEach(dep => {
                    const match = dep.match(/'([^']+)':/);
                    if (match)
                        dependencies.removed.push(match[1]);
                });
            }
            const lines = packageFile.patch.split('\n');
            for (let i = 0; i < lines.length - 1; i++) {
                if (lines[i].startsWith('-') && lines[i + 1].startsWith('+')) {
                    const oldMatch = lines[i].match(/'([^']+)':\s*'([^']+)'/);
                    const newMatch = lines[i + 1].match(/'([^']+)':\s*'([^']+)'/);
                    if (oldMatch && newMatch && oldMatch[1] === newMatch[1] && oldMatch[2] !== newMatch[2]) {
                        dependencies.updated.push(`${oldMatch[1]}: ${oldMatch[2]} → ${newMatch[2]}`);
                    }
                }
            }
        }
        return dependencies;
    }
    generateProfessionalTitle(analysis) {
        const { commitTypes, stats, categories, features } = analysis;
        const primaryType = Object.entries(commitTypes)
            .filter(([_, commits]) => commits.length > 0)
            .sort(([_, a], [__, b]) => b.length - a.length)[0];
        if (!primaryType) {
            return `Update: ${stats.filesChanged} files modified`;
        }
        const [type] = primaryType;
        switch (type) {
            case 'features':
                if (features && features.length > 0) {
                    return `Feature: ${features[0].substring(0, 60)}${features[0].length > 60 ? '...' : ''}`;
                }
                return `Feature: Add new functionality (${stats.filesChanged} files)`;
            case 'fixes':
                return `Fix: Resolve issues in ${Object.keys(categories)[0] || 'application'}`;
            case 'refactoring':
                return `Refactor: Improve code structure and maintainability`;
            case 'performance':
                return `Performance: Optimize application performance`;
            case 'documentation':
                return `Documentation: Update project documentation`;
            case 'testing':
                return `Testing: Add/update test coverage`;
            case 'configuration':
                return `Configuration: Update project configuration`;
            case 'dependencies':
                if (analysis.dependencies.added.length > 0) {
                    return `Dependencies: Add ${analysis.dependencies.added[0]}${analysis.dependencies.added.length > 1 ? ' and others' : ''}`;
                }
                return `Dependencies: Update project dependencies`;
            default:
                return `Update: ${stats.filesChanged} files changed`;
        }
    }
    generateComprehensiveBody(analysis) {
        const { categories, commitTypes, stats, impactAnalysis, features, technicalChanges, dependencies } = analysis;
        let body = '## Executive Summary\n\n';
        body += this.generateExecutiveSummary(analysis);
        body += '\n\n';
        if (features && features.length > 0) {
            body += '## Features and Improvements\n\n';
            features.forEach((feature) => {
                body += `- ${feature}\n`;
            });
            body += '\n';
        }
        if (technicalChanges && Object.values(technicalChanges).some((arr) => arr.length > 0)) {
            body += '## Technical Changes\n\n';
            if (technicalChanges.architecturalChanges?.length > 0) {
                body += '### Architectural Updates\n';
                technicalChanges.architecturalChanges.forEach((change) => {
                    body += `- ${change}\n`;
                });
                body += '\n';
            }
            if (technicalChanges.newPatterns?.length > 0) {
                body += '### Design Patterns\n';
                technicalChanges.newPatterns.forEach((pattern) => {
                    body += `- ${pattern}\n`;
                });
                body += '\n';
            }
            if (technicalChanges.addedFunctionality?.length > 0) {
                body += '### Added Functionality\n';
                technicalChanges.addedFunctionality.forEach((func) => {
                    body += `- ${func}\n`;
                });
                body += '\n';
            }
            if (technicalChanges.removedFunctionality?.length > 0) {
                body += '### Removed/Deprecated\n';
                technicalChanges.removedFunctionality.forEach((func) => {
                    body += `- ${func}\n`;
                });
                body += '\n';
            }
        }
        body += '## Changed Files Analysis\n\n';
        body += `Total: **${stats.filesChanged} files** | **+${stats.additions} additions** | **-${stats.deletions} deletions**\n\n`;
        Object.entries(categories).forEach(([category, files]) => {
            const categoryStats = {
                additions: files.reduce((sum, f) => sum + f.additions, 0),
                deletions: files.reduce((sum, f) => sum + f.deletions, 0),
            };
            body += `### ${category} (${files.length} file${files.length !== 1 ? 's' : ''})\n\n`;
            body += `Changes: +${categoryStats.additions} / -${categoryStats.deletions}\n\n`;
            const filesByDir = {};
            files.forEach((file) => {
                const dir = file.filename.substring(0, file.filename.lastIndexOf('/')) || 'root';
                if (!filesByDir[dir])
                    filesByDir[dir] = [];
                filesByDir[dir].push(file);
            });
            Object.entries(filesByDir).forEach(([dir, dirFiles]) => {
                body += `**${dir}/**\n`;
                dirFiles.forEach(file => {
                    const status = this.getFileStatusIndicator(file.status);
                    const changeIndicator = this.getChangeIndicator(file.additions, file.deletions);
                    body += `- \`${file.filename.split('/').pop()}\` ${status} ${changeIndicator}\n`;
                });
                body += '\n';
            });
        });
        if (impactAnalysis) {
            body += '## Impact Analysis\n\n';
            body += `**Risk Level:** ${impactAnalysis.riskLevel}\n`;
            body += `**Performance Impact:** ${impactAnalysis.performanceImpact}\n\n`;
            if (impactAnalysis.affectedAreas?.length > 0) {
                body += '### Affected Areas\n';
                impactAnalysis.affectedAreas.forEach((area) => {
                    body += `- ${area}\n`;
                });
                body += '\n';
            }
            if (impactAnalysis.potentialBreaking?.length > 0) {
                body += `### Potential Breaking Changes\n`;
                impactAnalysis.potentialBreaking.forEach((change) => {
                    body += `- ${change}\n`;
                });
                body += '\n';
            }
        }
        if (dependencies && Object.values(dependencies).some((arr) => arr.length > 0)) {
            body += '## Dependencies\n\n';
            if (dependencies.added?.length > 0) {
                body += '### Added\n';
                dependencies.added.forEach((dep) => {
                    body += `- \`${dep}\`\n`;
                });
                body += '\n';
            }
            if (dependencies.removed?.length > 0) {
                body += '### Removed\n';
                dependencies.removed.forEach((dep) => {
                    body += `- \`${dep}\`\n`;
                });
                body += '\n';
            }
            if (dependencies.updated?.length > 0) {
                body += '### Updated\n';
                dependencies.updated.forEach((dep) => {
                    body += `- ${dep}\n`;
                });
                body += '\n';
            }
        }
        if (impactAnalysis?.testingRequired?.length > 0) {
            body += '## Testing Requirements\n\n';
            body += 'The following areas require thorough testing:\n\n';
            impactAnalysis.testingRequired.forEach((test) => {
                body += `- ${test}\n`;
            });
            body += '\n';
        }
        if (impactAnalysis?.potentialBreaking?.length > 0 || dependencies?.removed?.length > 0) {
            body += '## Migration Guide\n\n';
            body += 'This PR contains changes that may require updates to existing code:\n\n';
            if (dependencies?.removed?.length > 0) {
                body += '1. **Removed Dependencies:** Ensure alternative implementations for removed packages\n';
            }
            if (impactAnalysis?.potentialBreaking?.length > 0) {
                body += '2. **Breaking Changes:** Review and update affected code areas\n';
            }
            body += '3. **Testing:** Run comprehensive test suite before deployment\n';
            body += '4. **Documentation:** Update relevant documentation to reflect changes\n\n';
        }
        body += '## Commit Details\n\n';
        Object.entries(commitTypes).forEach(([type, typeCommits]) => {
            if (typeCommits.length === 0)
                return;
            const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
            body += `### ${typeLabel} (${typeCommits.length})\n\n`;
            typeCommits.slice(0, 5).forEach((commit) => {
                const shortMessage = commit.message.split('\n')[0];
                body += `- \`${commit.sha}\` ${shortMessage} - *${commit.author}*\n`;
            });
            if (typeCommits.length > 5) {
                body += `- ... and ${typeCommits.length - 5} more\n`;
            }
            body += '\n';
        });
        body += '## Pre-Merge Checklist\n\n';
        body += '- [ ] Code review completed\n';
        body += '- [ ] All tests passing\n';
        body += '- [ ] Documentation updated\n';
        body += '- [ ] No console errors or warnings\n';
        body += '- [ ] Performance impact assessed\n';
        if (impactAnalysis?.riskLevel === 'High') {
            body += '- [ ] Security review completed\n';
            body += '- [ ] Rollback plan prepared\n';
        }
        if (dependencies?.added?.length > 0) {
            body += '- [ ] New dependencies reviewed for security\n';
            body += '- [ ] License compatibility verified\n';
        }
        body += '- [ ] Deployment plan prepared\n';
        body += '\n## Deployment Notes\n\n';
        if (dependencies?.added?.length > 0 || dependencies?.updated?.length > 0) {
            body += '- Run `npm install` or `yarn install` to update dependencies\n';
        }
        if (categories['Database Migrations']) {
            body += '- Execute database migrations before deployment\n';
        }
        if (categories['Configuration'] || categories['YAML Configuration'] || categories['JSON Configuration']) {
            body += '- Review and update configuration settings\n';
        }
        body += '- Monitor application logs after deployment\n';
        body += '- Be prepared to rollback if issues arise\n';
        return body;
    }
    generateExecutiveSummary(analysis) {
        const { stats, commitTypes, impactAnalysis, features } = analysis;
        let summary = 'This pull request ';
        const commitCounts = Object.entries(commitTypes)
            .map(([type, commits]) => ({ type, count: commits.length }))
            .sort((a, b) => b.count - a.count);
        if (commitCounts.length === 0 || commitCounts[0].count === 0) {
            summary += 'contains miscellaneous updates';
        }
        else {
            const primary = commitCounts[0];
            const secondary = commitCounts[1];
            switch (primary.type) {
                case 'features':
                    summary += `introduces ${primary.count} new feature${primary.count !== 1 ? 's' : ''}`;
                    if (features && features.length > 0) {
                        summary += `, primarily ${features[0].toLowerCase()}`;
                    }
                    break;
                case 'fixes':
                    summary += `addresses ${primary.count} issue${primary.count !== 1 ? 's' : ''}`;
                    break;
                case 'refactoring':
                    summary += 'refactors existing code for improved maintainability';
                    break;
                case 'performance':
                    summary += 'includes performance optimizations';
                    break;
                default:
                    summary += 'includes various improvements';
            }
            if (secondary && secondary.count > 0) {
                summary += ` along with ${secondary.count} ${secondary.type.replace(/s$/, '')}${secondary.count !== 1 ? 's' : ''}`;
            }
        }
        summary += `. The changes span ${stats.filesChanged} files with ${stats.additions} insertions and ${stats.deletions} deletions`;
        if (impactAnalysis) {
            summary += `. Risk assessment: **${impactAnalysis.riskLevel}**`;
            if (impactAnalysis.potentialBreaking?.length > 0) {
                summary += '. **Note:** This PR contains potential breaking changes that require careful review';
            }
        }
        summary += '.';
        return summary;
    }
    getFileStatusIndicator(status) {
        return constants_1.FILE_STATUS_INDICATORS[status] || '[CHG]';
    }
    getChangeIndicator(additions, deletions) {
        const total = additions + deletions;
        if (total === 0)
            return '';
        if (total < 10)
            return '(minor changes)';
        if (total < 50)
            return '(moderate changes)';
        if (total < 200)
            return '(significant changes)';
        return '(major changes)';
    }
}
exports.CreatePRTool = CreatePRTool;
exports.createPRTool = {
    name: 'create-pr',
    description: 'Create a comprehensive pull request with detailed analysis of changes',
    inputSchema: {
        type: 'object',
        properties: {
            owner: {
                type: 'string',
                description: 'Repository owner',
            },
            repo: {
                type: 'string',
                description: 'Repository name',
            },
            title: {
                type: 'string',
                description: 'PR title (auto-generated if not provided)',
            },
            head: {
                type: 'string',
                description: 'Branch to merge from',
            },
            base: {
                type: 'string',
                description: 'Branch to merge into',
            },
            body: {
                type: 'string',
                description: 'PR description (auto-generated if not provided)',
            },
            draft: {
                type: 'boolean',
                description: 'Create as draft PR',
            },
            auto_generate: {
                type: 'boolean',
                description: 'Auto-generate comprehensive title and body from changes (default: true)',
            },
        },
        required: ['owner', 'repo', 'head', 'base'],
    },
    handler: async (args) => {
        const token = process.env.GITHUB_TOKEN;
        if (!token) {
            throw new Error('GITHUB_TOKEN not configured');
        }
        const tool = new CreatePRTool(token);
        return tool.execute(args);
    },
};
//# sourceMappingURL=create-pr.js.map