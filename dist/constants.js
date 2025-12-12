"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRIORITY_LABELS = exports.COMMIT_PATTERNS = exports.KEYWORD_CATEGORY_MAP = exports.EXTENSION_CATEGORY_MAP = exports.REVIEW_STATUS_MAP = exports.FILE_STATUS_BADGES = exports.FILE_STATUS_INDICATORS = void 0;
exports.FILE_STATUS_INDICATORS = {
    added: '[NEW]',
    modified: '[MOD]',
    removed: '[DEL]',
    renamed: '[REN]',
    copied: '[CPY]',
    changed: '[CHG]',
    unchanged: '[ ]'
};
exports.FILE_STATUS_BADGES = {
    added: '[+]',
    modified: '[M]',
    removed: '[-]',
    renamed: '[R]',
    copied: '[C]',
    changed: '[~]',
    unchanged: '[ ]'
};
exports.REVIEW_STATUS_MAP = {
    APPROVED: 'Approved',
    CHANGES_REQUESTED: 'Changes Requested',
    COMMENTED: 'Commented',
    PENDING: 'Pending',
    DISMISSED: 'Dismissed'
};
exports.EXTENSION_CATEGORY_MAP = new Map([
    ['.ts', 'Source Code'],
    ['.tsx', 'Source Code'],
    ['.js', 'JavaScript Files'],
    ['.jsx', 'JavaScript Files'],
    ['.css', 'Stylesheets'],
    ['.scss', 'Stylesheets'],
    ['.sass', 'Stylesheets'],
    ['.less', 'Stylesheets'],
    ['.md', 'Documentation'],
    ['.txt', 'Documentation'],
    ['.rst', 'Documentation'],
    ['.json', 'JSON Configuration'],
    ['.yml', 'YAML Configuration'],
    ['.yaml', 'YAML Configuration'],
    ['.sql', 'Database Migrations']
]);
exports.KEYWORD_CATEGORY_MAP = new Map([
    ['test', 'Test Files'],
    ['spec', 'Test Files'],
    ['component', 'React Components'],
    ['Component', 'React Components'],
    ['hook', 'React Hooks'],
    ['util', 'Utility Functions'],
    ['helper', 'Utility Functions'],
    ['api', 'API Services'],
    ['service', 'API Services'],
    ['type', 'Type Definitions'],
    ['interface', 'Type Definitions'],
    ['model', 'Data Models'],
    ['controller', 'Controllers'],
    ['middleware', 'Middleware']
]);
exports.COMMIT_PATTERNS = [
    [/feat|feature|add|implement|create/, 'features'],
    [/fix|bug|resolve|patch|correct/, 'fixes'],
    [/refactor|restructure|reorganize|improve structure/, 'refactoring'],
    [/perf|performance|optimize|speed|faster/, 'performance'],
    [/docs|documentation|readme|comment/, 'documentation'],
    [/test|spec|coverage/, 'testing'],
    [/config|build|ci|cd|pipeline/, 'configuration'],
    [/deps|dependencies|upgrade|update package/, 'dependencies']
];
exports.PRIORITY_LABELS = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL'
};
//# sourceMappingURL=constants.js.map