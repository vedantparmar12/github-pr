export const FILE_STATUS_INDICATORS: Record<string, string> = {
    added: '[NEW]',
    modified: '[MOD]',
    removed: '[DEL]',
    renamed: '[REN]',
    copied: '[CPY]',
    changed: '[CHG]',
    unchanged: '[ ]'
};

export const FILE_STATUS_BADGES: Record<string, string> = {
    added: '[+]',
    modified: '[M]',
    removed: '[-]',
    renamed: '[R]',
    copied: '[C]',
    changed: '[~]',
    unchanged: '[ ]'
};

export const REVIEW_STATUS_MAP: Record<string, string> = {
    APPROVED: 'Approved',
    CHANGES_REQUESTED: 'Changes Requested',
    COMMENTED: 'Commented',
    PENDING: 'Pending',
    DISMISSED: 'Dismissed'
};

export const EXTENSION_CATEGORY_MAP = new Map<string, string>([
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

export const KEYWORD_CATEGORY_MAP = new Map<string, string>([
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

export const COMMIT_PATTERNS: [RegExp, string][] = [
    [/feat|feature|add|implement|create/, 'features'],
    [/fix|bug|resolve|patch|correct/, 'fixes'],
    [/refactor|restructure|reorganize|improve structure/, 'refactoring'],
    [/perf|performance|optimize|speed|faster/, 'performance'],
    [/docs|documentation|readme|comment/, 'documentation'],
    [/test|spec|coverage/, 'testing'],
    [/config|build|ci|cd|pipeline/, 'configuration'],
    [/deps|dependencies|upgrade|update package/, 'dependencies']
];

export const PRIORITY_LABELS: Record<string, string> = {
    low: 'LOW',
    medium: 'MEDIUM',
    high: 'HIGH',
    critical: 'CRITICAL'
};
