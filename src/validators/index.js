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
    const invalidCharPattern = /[<>{}[\]\\\/]/;
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
        .replace(/\s+/g, ' '); // Normalize whitespace
}

module.exports = {
    validatePlayerName,
    validateClubName,
    validateDWZValue,
    validateTournamentData,
    sanitizeSearchInput
};
