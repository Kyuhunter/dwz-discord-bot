const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { logger } = require('../logger');

const CONFIG_PATH = path.join(__dirname, '../../../config.yaml');
const TRANSLATIONS_DIR = path.join(__dirname, '../../../translations');

function loadConfig() {
    try {
        const file = fs.readFileSync(CONFIG_PATH, 'utf8');
        const parsed = yaml.load(file);
        if (parsed && typeof parsed === 'object') {
            logger.info('Configuration loaded successfully');
            return parsed;
        }
    } catch (error) {
        logger.error('Error loading configuration', error.message);
    }
    return null;
}

function loadTranslations() {
    try {
        const files = fs.readdirSync(TRANSLATIONS_DIR).filter(f => f.endsWith('.yaml'));
        const translations = {};
        for (const file of files) {
            const lang = path.basename(file, '.yaml');
            const data = fs.readFileSync(path.join(TRANSLATIONS_DIR, file), 'utf8');
            translations[lang] = yaml.load(data) || {};
        }
        logger.info(`Loaded translations for: ${Object.keys(translations).join(', ')}`);
        return translations;
    } catch (error) {
        logger.error('Error loading translations', error.message);
    }
    return null;
}

module.exports = { loadConfig, loadTranslations };
