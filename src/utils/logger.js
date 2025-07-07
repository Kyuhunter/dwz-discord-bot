/**
 * Centralized logging utility
 */

const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const LOG_COLORS = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[35m', // Magenta
    RESET: '\x1b[0m'   // Reset
};

class Logger {
    constructor(level = LOG_LEVELS.INFO) {
        this.level = level;
    }

    /**
     * Set the logging level
     * @param {number} level - The logging level
     */
    setLevel(level) {
        this.level = level;
    }

    /**
     * Format log message with timestamp and level
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {any} data - Additional data to log
     * @returns {string} Formatted log message
     */
    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const color = LOG_COLORS[level.toUpperCase()];
        const reset = LOG_COLORS.RESET;
        
        let formattedMessage = `${color}[${timestamp}] ${level.toUpperCase()}: ${message}${reset}`;
        
        if (data !== null && data !== undefined) {
            formattedMessage += `\n${color}Data: ${typeof data === 'object' ? JSON.stringify(data, null, 2) : data}${reset}`;
        }
        
        return formattedMessage;
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {any} data - Additional error data
     */
    error(message, data = {}) {
        if (this.level >= LOG_LEVELS.ERROR) {
            console.error(this.formatMessage('ERROR', message, data));
        }
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {any} data - Additional warning data
     */
    warn(message, data = {}) {
        if (this.level >= LOG_LEVELS.WARN) {
            console.warn(this.formatMessage('WARN', message, data));
        }
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {any} data - Additional info data
     */
    info(message, data = {}) {
        if (this.level >= LOG_LEVELS.INFO) {
            console.info(this.formatMessage('INFO', message, data));
        }
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {any} data - Additional debug data
     */
    debug(message, data = {}) {
        if (this.level >= LOG_LEVELS.DEBUG) {
            console.debug(this.formatMessage('DEBUG', message, data));
        }
    }

    /**
     * Log chart generation details
     * @param {string} playerName - Player name
     * @param {Array} tournaments - Tournament data
     */
    logChartGeneration(playerName, tournaments) {
        this.info(`Chart generation for ${playerName}:`);
        this.debug(`Input tournaments: ${tournaments.length}`);
        
        tournaments.forEach((t, i) => {
            this.debug(`  ${i + 1}. ${t.turniername || 'Unknown'}: dwzalt="${t.dwzalt}", dwzneu="${t.dwzneu}"`);
        });
    }

    /**
     * Log command execution
     * @param {string} commandName - Name of the command
     * @param {string} userId - User ID who executed the command
     * @param {Object} options - Command options
     */
    logCommandExecution(commandName, userId, options = {}) {
        this.info(`Command executed: ${commandName} by user ${userId}`, options);
    }

    /**
     * Log search operation
     * @param {string} searchType - Type of search (player, club, etc.)
     * @param {string} searchTerm - Search term
     * @param {number} resultCount - Number of results found
     */
    logSearch(searchType, searchTerm, resultCount) {
        this.info(`${searchType} search: "${searchTerm}" -> ${resultCount} results`);
    }
}

// Create default logger instance
const logger = new Logger(process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LOG_LEVELS.INFO);

module.exports = {
    Logger,
    LOG_LEVELS,
    logger
};
