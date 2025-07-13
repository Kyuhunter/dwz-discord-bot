const { ERROR_MESSAGES } = require('../../constants');
const {
    DWZBotError,
    ValidationError,
    SearchError,
    NetworkError,
    ChartGenerationError
} = require('./classes');

/**
 * Convert generic errors to application-specific errors
 */
function categorizeError(error, operation = 'unknown') {
    if (error.isAxiosError) {
        return new NetworkError(ERROR_MESSAGES.NETWORK_ERROR, null, error);
    }
    if (error.code === 'ENOTFOUND') {
        return new NetworkError(ERROR_MESSAGES.CONNECTION_ERROR, null, error);
    }
    if (error.code === 'ETIMEDOUT') {
        return new NetworkError(ERROR_MESSAGES.TIMEOUT_ERROR, null, error);
    }
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
    if (operation === 'chart_generation') {
        return new ChartGenerationError(error.message, error);
    }
    if (operation === 'search') {
        return new SearchError(error.message, 'SEARCH_OPERATION', error);
    }
    if (operation === 'validation') {
        return new ValidationError(error.message, null, error);
    }
    return new DWZBotError(error.message, error.code || 'UNKNOWN_ERROR', error);
}

/**
 * Create user-friendly error message
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

module.exports = { categorizeError, createUserFriendlyError };
