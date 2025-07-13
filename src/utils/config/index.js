const { defaultConfig } = require('./defaults');
const { loadConfig, loadTranslations } = require('./loader');
const { logger } = require('../logger');

class ConfigManager {
    constructor() {
        // Initialize configuration and translations
        this.config = defaultConfig;
        this.translations = { de: {}, en: {} };
        this.loadConfig();
        this.loadTranslations();
        this.currentLanguage = this.config.language?.default || defaultConfig.language.default;
    }

    /**
     * Instance method to reload config from file
     */
    loadConfig() {
        const newConfig = loadConfig() || defaultConfig;
        this.config = newConfig;
        this.currentLanguage = this.config.language?.default || defaultConfig.language.default;
        return this.config;
    }

    /**
     * Instance method to reload translations from files
     */
    loadTranslations() {
        const newTrans = loadTranslations() || { de: {}, en: {} };
        this.translations = newTrans;
        return this.translations;
    }

    get(path, defaultValue = null) {
        const keys = path.split('.');
        let val = this.config;
        for (const key of keys) {
            if (val && typeof val === 'object' && key in val) {
                val = val[key];
            } else {
                return defaultValue;
            }
        }
        return val;
    }

    t(key, params = {}, language = null) {
        const lang = language || this.currentLanguage;
        const fallback = this.config.language?.fallback || defaultConfig.language.fallback;
        let translation = this._getTranslationValue(key, lang);
        if (!translation && lang !== fallback) {
            translation = this._getTranslationValue(key, fallback);
        }
        if (!translation) {
            logger.warn(`Translation not found: ${key} (${lang})`);
            return key;
        }
        return this._interpolate(translation, params);
    }

    _getTranslationValue(key, lang) {
        const tree = this.translations[lang];
        if (!tree) return null;
        const parts = key.split('.');
        let val = tree;
        for (const part of parts) {
            if (val && typeof val === 'object' && part in val) {
                val = val[part];
            } else {
                return null;
            }
        }
        return typeof val === 'string' ? val : null;
    }

    _interpolate(text, params) {
        return text.replace(/\{(\w+)\}/g, (m, p) => params[p] !== undefined ? params[p] : m);
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLanguage = lang;
            logger.info(`Language changed to: ${lang}`);
            return true;
        }
        logger.warn(`Language not available: ${lang}`);
        return false;
    }

    getAvailableLanguages() {
        return Object.keys(this.translations);
    }

    reloadConfig() {
        this.config = loadConfig() || defaultConfig;
        this.translations = loadTranslations() || { de: {}, en: {} };
    }

    /**
     * Get the bot configuration section (or app info if missing)
     * @returns {Object}
     */
    getBotConfig() {
        const botCfg = this.config && this.config.bot;
        if (botCfg && typeof botCfg.name === 'string') {
            return botCfg;
        }
        const appCfg = this.config && this.config.app;
        return appCfg || defaultConfig.app;
    }

    getTranslation(key, language) {
        return this.t(key, {}, language);
    }

    getDefaultLanguage() {
        return this.config.language?.default || defaultConfig.language.default;
    }
}

module.exports = ConfigManager;
