/**
 * Application constants
 */

// External URLs
const EXTERNAL_URLS = {
    SCHACHBUND_BASE: 'https://www.schachbund.de',
    SCHACHBUND_PLAYER_SEARCH: 'https://www.schachbund.de/spieler.html',
    SCHACHBUND_FAVICON: 'https://www.schachbund.de/favicon.ico'
};

// Discord embed colors
const EMBED_COLORS = {
    SUCCESS: 0x00FF00,
    ERROR: 0xFF0000,
    INFO: 0x0099FF,
    WARNING: 0xFFAA00
};

// Search and pagination limits
const LIMITS = {
    MAX_SEARCH_RESULTS: 10,
    MAX_TOURNAMENT_NAME_LENGTH: 20,
    MIN_TOURNAMENTS_FOR_CHART: 2,
    SEARCH_TIMEOUT_MS: 10000
};

// Chart configuration
const CHART_CONFIG = {
    WIDTH: 800,
    HEIGHT: 400,
    BACKGROUND_COLOR: 'white',
    LINE_COLOR: 'rgb(75, 192, 192)',
    LINE_BACKGROUND_COLOR: 'rgba(75, 192, 192, 0.2)',
    POINT_RADIUS: 6,
    POINT_HOVER_RADIUS: 8,
    CLEANUP_DELAY_MS: 30000
};

// DWZ specific constants
const DWZ_CONSTANTS = {
    INVALID_DWZ_VALUES: ['0', '', null, undefined],
    MIN_VALID_DWZ: 1,
    MAX_REASONABLE_DWZ: 3000,
    CHART_PADDING_PERCENTAGE: 0.1,
    MIN_CHART_PADDING: 50
};

// Club search patterns
const CLUB_PATTERNS = {
    KEYWORDS: ['SV', 'SC', 'SK', 'TSV', 'FC', 'TuS', 'Verein', 'Schach', 'Club', 'Klub', 'Chess'],
    CITY_PATTERN: /\b([A-ZÄÖÜ][a-zäöüß]{3,}(?:-[A-ZÄÖÜ][a-zäöüß]+)*)\b/
};

// Error messages
const ERROR_MESSAGES = {
    NO_PLAYERS_FOUND: 'Keine Spieler gefunden',
    SEARCH_UNAVAILABLE: 'Search service temporarily unavailable',
    CONNECTION_ERROR: 'Cannot connect to schachbund.de',
    TIMEOUT_ERROR: 'Search request timed out',
    INVALID_TOKEN: 'Invalid bot token',
    INSUFFICIENT_DATA: 'Insufficient tournament data for chart generation'
};

// Success messages
const SUCCESS_MESSAGES = {
    BOT_READY: 'Bot is ready and operational',
    COMMAND_LOADED: 'Command loaded successfully',
    EVENT_LOADED: 'Event loaded successfully'
};

module.exports = {
    EXTERNAL_URLS,
    EMBED_COLORS,
    LIMITS,
    CHART_CONFIG,
    DWZ_CONSTANTS,
    CLUB_PATTERNS,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES
};
