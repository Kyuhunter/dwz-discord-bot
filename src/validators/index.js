/**
 * Input validation utilities
 */

const { DWZ_CONSTANTS, LIMITS } = require('../constants');

/**
 * Validate player name input
 * @param {string} playerName - Player name to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validatePlayerName(playerName) {
    if (!playerName || typeof playerName !== 'string') {
        return {
            isValid: false,
            error: 'Player name is required and must be a string'
        };
    }

    const trimmedName = playerName.trim();
    
    if (trimmedName.length === 0) {
        return {
            isValid: false,
            error: 'Player name cannot be empty'
        };
    }

    if (trimmedName.length < 2) {
        return {
            isValid: false,
            error: 'Player name must be at least 2 characters long'
        };
    }

    if (trimmedName.length > 100) {
        return {
            isValid: false,
            error: 'Player name must be less than 100 characters'
        };
    }

    // Check for special characters that might break search
    const invalidCharPattern = /[<>{}[\]\\\/\@\#\$]/;
    if (invalidCharPattern.test(trimmedName)) {
        return {
            isValid: false,
            error: 'Player name contains invalid characters'
        };
    }

    return {
        isValid: true,
        sanitizedValue: trimmedName
    };
}

/**
 * Validate club name input
 * @param {string} clubName - Club name to validate
 * @returns {Object} Validation result with isValid boolean and error message
 */
function validateClubName(clubName) {
    // Club name is optional
    if (!clubName) {
        return {
            isValid: true,
            sanitizedValue: null
        };
    }

    if (typeof clubName !== 'string') {
        return {
            isValid: false,
            error: 'Club name must be a string'
        };
    }

    const trimmedClub = clubName.trim();
    
    if (trimmedClub.length === 0) {
        return {
            isValid: true,
            sanitizedValue: null
        };
    }

    if (trimmedClub.length > 100) {
        return {
            isValid: false,
            error: 'Club name must be less than 100 characters'
        };
    }

    // Check for special characters that might break search
    const invalidCharPattern = /[<>{}[\]\\\/]/;
    if (invalidCharPattern.test(trimmedClub)) {
        return {
            isValid: false,
            error: 'Club name contains invalid characters'
        };
    }

    return {
        isValid: true,
        sanitizedValue: trimmedClub
    };
}

/**
 * Validate DWZ value
 * @param {string|number} dwzValue - DWZ value to validate
 * @returns {Object} Validation result
 */
function validateDWZValue(dwzValue) {
    if (DWZ_CONSTANTS.INVALID_DWZ_VALUES.includes(dwzValue)) {
        return {
            isValid: false,
            error: 'Invalid DWZ value'
        };
    }

    const numericDWZ = parseInt(dwzValue);
    
    if (isNaN(numericDWZ)) {
        return {
            isValid: false,
            error: 'DWZ value must be numeric'
        };
    }

    if (numericDWZ < DWZ_CONSTANTS.MIN_VALID_DWZ) {
        return {
            isValid: false,
            error: `DWZ value must be at least ${DWZ_CONSTANTS.MIN_VALID_DWZ}`
        };
    }

    if (numericDWZ > DWZ_CONSTANTS.MAX_REASONABLE_DWZ) {
        return {
            isValid: false,
            error: `DWZ value seems unreasonably high (>${DWZ_CONSTANTS.MAX_REASONABLE_DWZ})`
        };
    }

    return {
        isValid: true,
        sanitizedValue: numericDWZ
    };
}

/**
 * Validate tournament data for chart generation
 * @param {Array} tournaments - Array of tournament objects
 * @returns {Object} Validation result
 */
function validateTournamentData(tournaments) {
    if (!Array.isArray(tournaments)) {
        return {
            isValid: false,
            error: 'Tournament data must be an array'
        };
    }

    if (tournaments.length === 0) {
        return {
            isValid: false,
            error: 'No tournament data provided'
        };
    }

    const validTournaments = tournaments.filter(tournament => {
        if (!tournament || typeof tournament !== 'object') {
            return false;
        }

        // Check if tournament has valid ending DWZ
        const dwzValidation = validateDWZValue(tournament.dwzneu);
        return dwzValidation.isValid;
    });

    if (validTournaments.length < LIMITS.MIN_TOURNAMENTS_FOR_CHART) {
        return {
            isValid: false,
            error: `Insufficient tournament data. Need at least ${LIMITS.MIN_TOURNAMENTS_FOR_CHART} valid tournaments for chart generation`,
            validCount: validTournaments.length
        };
    }

    return {
        isValid: true,
        validTournaments,
        totalCount: tournaments.length,
        validCount: validTournaments.length
    };
}

/**
 * Sanitize search input by removing potentially harmful characters
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeSearchInput(input) {
    if (!input || typeof input !== 'string') {
        return '';
    }

    return input
        .trim()
        .replace(/[<>{}[\]\\\/]/g, '') // Remove potentially harmful characters
        .replace(/[\t\n\r]/g, ' ') // Replace tabs, newlines with spaces
        .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Validate DWZ rating number
 * @param {number} rating - DWZ rating to validate
 * @returns {boolean} True if valid DWZ rating
 */
function validateDWZRating(rating) {
    if (typeof rating !== 'number' || isNaN(rating)) {
        return false;
    }
    return rating >= 800 && rating <= 3000;
}

/**
 * Validate tournament name
 * @param {string} tournamentName - Tournament name to validate
 * @returns {boolean} True if valid tournament name
 */
function validateTournamentName(tournamentName) {
    if (!tournamentName || typeof tournamentName !== 'string') {
        return false;
    }
    const trimmed = tournamentName.trim();
    return trimmed.length >= 3 && trimmed.length <= 100;
}

/**
 * Validate date string
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid date string
 */
function validateDateString(dateString) {
    if (!dateString || typeof dateString !== 'string') {
        return false;
    }
    
    const dateStr = dateString.trim();
    
    // Check various date formats
    const formats = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD (ISO format)
        /^\d{2}\.\d{2}\.\d{4}$/, // DD.MM.YYYY (German format)
        /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or MM/DD/YYYY (US format)
        /^\d{4}\/\d{1,2}\/\d{1,2}$/, // YYYY/M/D format
    ];
    
    // Check if format matches
    let formatMatches = false;
    for (const format of formats) {
        if (format.test(dateStr)) {
            formatMatches = true;
            break;
        }
    }
    
    if (!formatMatches) {
        return false;
    }
    
    // Parse date based on format
    let parsedDate;
    if (dateStr.includes('.')) {
        // German format DD.MM.YYYY
        const [day, month, year] = dateStr.split('.');
        parsedDate = new Date(year, month - 1, day);
        
        // Validate the parsed date components
        if (parsedDate.getFullYear() != year || 
            parsedDate.getMonth() != month - 1 || 
            parsedDate.getDate() != day) {
            return false;
        }
    } else if (dateStr.includes('-')) {
        // ISO format YYYY-MM-DD
        parsedDate = new Date(dateStr);
    } else if (dateStr.includes('/')) {
        // Various slash formats
        if (dateStr.match(/^\d{4}\//)) {
            // YYYY/MM/DD format
            parsedDate = new Date(dateStr);
        } else {
            // MM/DD/YYYY, M/D/YYYY or DD/MM/YYYY format
            const parts = dateStr.split('/');
            if (parts.length === 3) {
                const part1 = parseInt(parts[0]);
                const part2 = parseInt(parts[1]);
                const year = parseInt(parts[2]);
                
                // Determine if it's US (MM/DD) or UK (DD/MM) format
                // If part1 > 12, it must be DD/MM format
                // If part2 > 12, it must be MM/DD format
                // Otherwise, accept both for this validation
                let month, day;
                if (part1 > 12) {
                    // DD/MM format
                    day = part1;
                    month = part2;
                } else if (part2 > 12) {
                    // MM/DD format
                    month = part1;
                    day = part2;
                } else {
                    // Ambiguous - try both formats
                    // First try MM/DD
                    month = part1;
                    day = part2;
                    parsedDate = new Date(year, month - 1, day);
                    if (parsedDate.getFullYear() == year && 
                        parsedDate.getMonth() == month - 1 && 
                        parsedDate.getDate() == day) {
                        // MM/DD worked
                    } else {
                        // Try DD/MM
                        month = part2;
                        day = part1;
                    }
                }
                
                parsedDate = new Date(year, month - 1, day);
                
                // Validate components
                if (parsedDate.getFullYear() != year || 
                    parsedDate.getMonth() != month - 1 || 
                    parsedDate.getDate() != day) {
                    return false;
                }
            }
        }
    }
    
    // Final validation
    return parsedDate && !isNaN(parsedDate.getTime()) && 
           parsedDate.getFullYear() >= 1900 && 
           parsedDate.getFullYear() <= 2100;
}

/**
 * Validate search query
 * @param {string} query - Search query to validate
 * @returns {boolean} True if valid search query
 */
function validateSearchQuery(query) {
    if (!query || typeof query !== 'string') {
        return false;
    }
    const trimmed = query.trim();
    return trimmed.length >= 2 && trimmed.length <= 100;
}

/**
 * Validate player data object
 * @param {Object} playerData - Player data to validate
 * @returns {boolean} True if valid player data
 */
function validatePlayerData(playerData) {
    if (!playerData || typeof playerData !== 'object') {
        return false;
    }
    
    // Must have a name
    if (!playerData.name || typeof playerData.name !== 'string' || playerData.name.trim().length === 0) {
        return false;
    }
    
    // If DWZ is provided, it must be valid
    if (playerData.dwz !== undefined && playerData.dwz !== null) {
        if (typeof playerData.dwz === 'string' && isNaN(Number(playerData.dwz))) {
            return false;
        }
        if (typeof playerData.dwz === 'number' && isNaN(playerData.dwz)) {
            return false;
        }
    }
    
    return true;
}

/**
 * Sanitize input - alias for sanitizeSearchInput
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
    return sanitizeSearchInput(input);
}

/**
 * Validate Discord interaction object
 * @param {Object} interaction - Discord interaction object
 * @returns {boolean} True if valid interaction
 */
function isValidInteraction(interaction) {
    if (!interaction || typeof interaction !== 'object') {
        return false;
    }
    
    // Must have reply function
    if (typeof interaction.reply !== 'function') {
        return false;
    }
    
    return true;
}

module.exports = {
    validatePlayerName,
    validateClubName,
    validateDWZValue,
    validateTournamentData,
    sanitizeSearchInput,
    validateDWZRating,
    validateTournamentName,
    validateDateString,
    validateSearchQuery,
    validatePlayerData,
    sanitizeInput,
    isValidInteraction
};
