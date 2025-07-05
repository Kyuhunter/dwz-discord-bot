const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

class ConfigManager {
    constructor() {
        this.config = null;
        this.translations = {};
        this.currentLanguage = 'de';
        this.loadConfig();
        this.loadTranslations();
    }

    /**
     * Load configuration from config.yaml
     */
    loadConfig() {
        try {
            const configPath = path.join(__dirname, '../..', 'config.yaml');
            const configFile = fs.readFileSync(configPath, 'utf8');
            this.config = yaml.load(configFile);
            this.currentLanguage = this.config.language?.default || 'de';
            console.log('✅ Configuration loaded successfully');
        } catch (error) {
            console.error('❌ Error loading configuration:', error.message);
            // Use default configuration
            this.config = this.getDefaultConfig();
        }
    }

    /**
     * Load translation files
     */
    loadTranslations() {
        try {
            const translationsDir = path.join(__dirname, '../..', 'translations');
            const translationFiles = fs.readdirSync(translationsDir).filter(file => file.endsWith('.yaml'));
            
            for (const file of translationFiles) {
                const lang = path.basename(file, '.yaml');
                const filePath = path.join(translationsDir, file);
                const translationData = fs.readFileSync(filePath, 'utf8');
                this.translations[lang] = yaml.load(translationData);
            }
            
            console.log(`✅ Loaded translations for languages: ${Object.keys(this.translations).join(', ')}`);
        } catch (error) {
            console.error('❌ Error loading translations:', error.message);
            // Use fallback translations
            this.translations = { de: {}, en: {} };
        }
    }

    /**
     * Get configuration value
     * @param {string} path - Dot notation path (e.g., 'bot.max_recent_tournaments')
     * @param {*} defaultValue - Default value if not found
     * @returns {*} Configuration value
     */
    get(path, defaultValue = null) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return defaultValue;
            }
        }
        
        return value;
    }

    /**
     * Get translated text
     * @param {string} key - Translation key in dot notation
     * @param {Object} params - Parameters for string interpolation
     * @param {string} language - Language code (optional, uses current language)
     * @returns {string} Translated text
     */
    t(key, params = {}, language = null) {
        const lang = language || this.currentLanguage;
        const fallbackLang = this.config?.language?.fallback || 'en';
        
        // Try to get translation in requested language
        let translation = this.getTranslationValue(key, lang);
        
        // Fallback to fallback language if not found
        if (!translation && lang !== fallbackLang) {
            translation = this.getTranslationValue(key, fallbackLang);
        }
        
        // If still not found, return the key itself
        if (!translation) {
            console.warn(`⚠️ Translation not found: ${key} (${lang})`);
            return key;
        }
        
        // Interpolate parameters
        return this.interpolate(translation, params);
    }

    /**
     * Get translation value from nested object
     * @param {string} key - Dot notation key
     * @param {string} lang - Language code
     * @returns {string|null} Translation value
     */
    getTranslationValue(key, lang) {
        if (!this.translations[lang]) {
            return null;
        }
        
        const keys = key.split('.');
        let value = this.translations[lang];
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return typeof value === 'string' ? value : null;
    }

    /**
     * Interpolate parameters into translation string
     * @param {string} text - Text with placeholders
     * @param {Object} params - Parameters to interpolate
     * @returns {string} Interpolated text
     */
    interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    /**
     * Set current language
     * @param {string} language - Language code
     */
    setLanguage(language) {
        if (this.translations[language]) {
            this.currentLanguage = language;
            console.log(`🌐 Language changed to: ${language}`);
        } else {
            console.warn(`⚠️ Language not available: ${language}`);
        }
    }

    /**
     * Get available languages
     * @returns {string[]} Array of language codes
     */
    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    /**
     * Reload configuration and translations
     */
    reload() {
        console.log('🔄 Reloading configuration and translations...');
        this.loadConfig();
        this.loadTranslations();
    }

    /**
     * Get default configuration (fallback)
     * @returns {Object} Default configuration
     */
    getDefaultConfig() {
        return {
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
                    user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
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
    }

    /**
     * Get embed color as integer
     * @param {string} type - Color type (success, info, warning, error)
     * @returns {number} Color as integer
     */
    getColor(type) {
        const colorHex = this.get(`display.colors.${type}`, '0099FF');
        return parseInt(colorHex, 16);
    }
}

// Create singleton instance
const configManager = new ConfigManager();

module.exports = configManager;
