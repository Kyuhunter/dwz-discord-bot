const { ERROR_MESSAGES } = require('../../constants');

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

module.exports = {
    DWZBotError,
    ValidationError,
    SearchError,
    NetworkError,
    ChartGenerationError
};
