"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseTool = void 0;
const logger_1 = require("../utils/logger");
class BaseTool {
    logger = (0, logger_1.createLogger)(this.constructor.name);
    async handler(args) {
        try {
            const input = this.inputSchema.parse(args);
            return await this.execute(input);
        }
        catch (error) {
            return this.createErrorResponse(error.message || 'Unknown error occurred');
        }
    }
    createSuccessResponse(text) {
        return { content: [{ type: 'text', text }] };
    }
    createErrorResponse(message) {
        return { content: [{ type: 'text', text: `Error in ${this.name}: ${message}` }], isError: true };
    }
}
exports.BaseTool = BaseTool;
//# sourceMappingURL=base-tool.js.map