const { logger } = require('../../utils/logger');
const { categorizeError } = require('./categorizer');

/**
 * Sanitize sensitive info and return errorInfo
 */
function handleError(error, context = {}) {
    const categorized = categorizeError(error);
    let sanitized = categorized.message;
    sanitized = sanitized.replace(/password:\s*\S+/ig, 'password: [REDACTED]');
    sanitized = sanitized.replace(/secret\S*/ig, '[REDACTED]');

    const info = {
        message: error.message,
        code: categorized.code || error.code || 'UNKNOWN_ERROR',
        type: error.name || 'Error',
        errorType: categorized.name,
        error: sanitized,
        timestamp: new Date().toISOString(),
        context
    };
    logger.error(`${info.type}: ${info.message}`, { code: info.code, context: info.context, stack: error.stack });
    return info;
}

function withErrorHandling(fn, operation = 'unknown') {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (err) {
            const categorized = categorizeError(err, operation);
            handleError(categorized, { operation, args: args.length });
            throw categorized;
        }
    };
}

function safeExecute(fn, fallback = null, operation = 'unknown') {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (err) {
            const categorized = categorizeError(err, operation);
            handleError(categorized, { operation, args: args.length, fallbackUsed: true });
            return fallback;
        }
    };
}

module.exports = { handleError, withErrorHandling, safeExecute };
