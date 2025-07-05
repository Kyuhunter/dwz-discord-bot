/**
 * Error handling utilities for the Discord bot
 */

const { logger } = require('../utils/logger');
const { ERROR_MESSAGES } = require('../constants');

/**
 * Custom error classes for different types of application errors
 */

class DWZBotError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', originalError = null) {
        super(message);
        this.name = 'DWZBotError';
        this.code = code;
        this.originalError = originalError;
        this.timestamp = new Date().toISOString();
    }
}

class ValidationError extends DWZBotError {
    constructor(message, field = null, originalError = null) {
        super(message, 'VALIDATION_ERROR', originalError);
        this.name = 'ValidationError';
        this.field = field;
    }
}

class SearchError extends DWZBotError {
    constructor(message, searchType = 'GENERAL', originalError = null) {
        super(message, 'SEARCH_ERROR', originalError);
        this.name = 'SearchError';
        this.searchType = searchType;
    }
}

class NetworkError extends DWZBotError {
    constructor(message, statusCode = null, originalError = null) {
        super(message, 'NETWORK_ERROR', originalError);
        this.name = 'NetworkError';
        this.statusCode = statusCode;
    }
}

class ChartGenerationError extends DWZBotError {
    constructor(message, originalError = null) {
        super(message, 'CHART_GENERATION_ERROR', originalError);
        this.name = 'ChartGenerationError';
    }
}

/**
 * Error handler utility functions
 */

/**
 * Handle and categorize errors
 * @param {Error} error - The error to handle
 * @param {Object} context - Additional context about where the error occurred
 * @returns {Object} Categorized error information
 */
function handleError(error, context = {}) {
    const errorInfo = {
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        type: error.name || 'Error',
        timestamp: new Date().toISOString(),
        context
    };

    // Log the error with context
    logger.error(`${errorInfo.type}: ${errorInfo.message}`, {
        code: errorInfo.code,
        context: errorInfo.context,
        stack: error.stack
    });

    return errorInfo;
}

/**
 * Convert generic errors to application-specific errors
 * @param {Error} error - Generic error
 * @param {string} operation - Operation that was being performed
 * @returns {DWZBotError} Application-specific error
 */
function categorizeError(error, operation = 'unknown') {
    // Network-related errors
    if (error.code === 'ENOTFOUND') {
        return new NetworkError(ERROR_MESSAGES.CONNECTION_ERROR, null, error);
    }
    
    if (error.code === 'ETIMEDOUT') {
        return new NetworkError(ERROR_MESSAGES.TIMEOUT_ERROR, null, error);
    }
    
    // HTTP errors
    if (error.response) {
        const statusCode = error.response.status;
        
        if (statusCode === 404) {
            return new SearchError(ERROR_MESSAGES.SEARCH_UNAVAILABLE, 'HTTP_404', error);
        }
        
        if (statusCode >= 500) {
            return new NetworkError('Server error occurred', statusCode, error);
        }
        
        return new NetworkError(`HTTP error ${statusCode}`, statusCode, error);
    }
    
    // Chart generation errors
    if (operation === 'chart_generation') {
        return new ChartGenerationError(error.message, error);
    }
    
    // Search operation errors
    if (operation === 'search') {
        return new SearchError(error.message, 'SEARCH_OPERATION', error);
    }
    
    // Validation errors
    if (operation === 'validation') {
        return new ValidationError(error.message, null, error);
    }
    
    // Default to generic DWZBotError
    return new DWZBotError(error.message, error.code || 'UNKNOWN_ERROR', error);
}

/**
 * Create user-friendly error message from error object
 * @param {Error} error - Error object
 * @param {string} defaultMessage - Default message if error type is unknown
 * @returns {Object} User-friendly error information
 */
function createUserFriendlyError(error, defaultMessage = 'An unexpected error occurred') {
    let title = 'Error';
    let description = defaultMessage;
    let canRetry = false;
    let suggestion = null;

    if (error instanceof ValidationError) {
        title = 'Input Validation Error';
        description = error.message;
        canRetry = false;
        suggestion = 'Please check your input and try again.';
    } else if (error instanceof NetworkError) {
        title = 'Connection Error';
        description = 'Unable to connect to the external service.';
        canRetry = true;
        suggestion = 'Please check your internet connection and try again later.';
    } else if (error instanceof SearchError) {
        title = 'Search Error';
        description = 'The search could not be completed.';
        canRetry = true;
        suggestion = 'Try a different search term or try again later.';
    } else if (error instanceof ChartGenerationError) {
        title = 'Chart Generation Error';
        description = 'Unable to generate the chart.';
        canRetry = false;
        suggestion = 'The player data may be insufficient for chart generation.';
    }

    return {
        title,
        description,
        canRetry,
        suggestion,
        originalError: error.message
    };
}

/**
 * Async error wrapper for command execution
 * @param {Function} asyncFunction - Async function to wrap
 * @param {string} operation - Name of the operation for error context
 * @returns {Function} Wrapped function with error handling
 */
function withErrorHandling(asyncFunction, operation = 'unknown') {
    return async (...args) => {
        try {
            return await asyncFunction(...args);
        } catch (error) {
            const categorizedError = categorizeError(error, operation);
            handleError(categorizedError, { operation, args: args.length });
            throw categorizedError;
        }
    };
}

/**
 * Safe execution wrapper that catches and logs errors without rethrowing
 * @param {Function} asyncFunction - Async function to execute safely
 * @param {any} fallbackValue - Value to return if function fails
 * @param {string} operation - Operation name for logging
 * @returns {Function} Safe wrapped function
 */
function safeExecute(asyncFunction, fallbackValue = null, operation = 'unknown') {
    return async (...args) => {
        try {
            return await asyncFunction(...args);
        } catch (error) {
            const categorizedError = categorizeError(error, operation);
            handleError(categorizedError, { 
                operation, 
                args: args.length,
                fallbackUsed: true 
            });
            return fallbackValue;
        }
    };
}

module.exports = {
    // Error classes
    DWZBotError,
    ValidationError,
    SearchError,
    NetworkError,
    ChartGenerationError,
    
    // Error handling functions
    handleError,
    categorizeError,
    createUserFriendlyError,
    withErrorHandling,
    safeExecute
};
