
// Default configuration values
const defaultConfig = {
    app: {
        name: "DWZ Discord Bot",
        version: "1.0.0",
        debug: false
    },
    language: {
        default: "de",
        fallback: "en"
    },
    bot: {
        max_recent_tournaments: 3,
        max_search_results: 10,
        show_player_id: true,
        show_fide_info: true,
        show_member_info: true,
        show_tournament_performance: true,
        show_dwz_changes: true,
        show_club_info: true,
        detailed_data_single_only: true
    },
    rate_limiting: {
        max_requests_per_minute: 30,
        max_concurrent_requests: 5,
        request_timeout: 15000,
        max_retries: 2
    },
    search: {
        enable_detailed_search: true,
        enable_club_lookup: true,
        min_search_length: 2,
        enable_fallback_parsing: true
    },
    display: {
        colors: {
            success: "00FF00",
            info: "0099FF",
            warning: "FFCC00",
            error: "FF0000"
        },
        embed: {
            show_timestamp: true,
            show_footer: true,
            footer_icon: "https://www.schachbund.de/favicon.ico",
            max_field_length: 1024,
            max_description_length: 4096
        }
    },
    external: {
        schachbund: {
            base_url: "https://www.schachbund.de",
            user_agent: "Mozilla/5.0"
        }
    },
    logging: {
        level: "info",
        enable_console: true,
        enable_file: false
    },
    features: {
        enable_caching: false,
        enable_statistics: false,
        enable_admin_commands: false,
        enable_tournament_notifications: false
    }
};

module.exports = { defaultConfig };
