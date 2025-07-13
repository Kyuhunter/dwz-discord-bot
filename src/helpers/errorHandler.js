// Entry point for error handling utilities
const {
    DWZBotError,
    ValidationError,
    SearchError,
    NetworkError,
    ChartGenerationError
} = require('./errors/classes');
const { categorizeError, createUserFriendlyError } = require('./errors/categorizer');
const { handleError, withErrorHandling, safeExecute } = require('./errors/handler');

module.exports = {
    DWZBotError,
    ValidationError,
    SearchError,
    NetworkError,
    ChartGenerationError,
    handleError,
    categorizeError,
    createUserFriendlyError,
    withErrorHandling,
    safeExecute
};
