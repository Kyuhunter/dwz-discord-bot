/**
 * Main Discord Bot Application - Refactored for Clean Code Standards
 * Entry point for the DWZ Discord Bot
 */

const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { logger, LOG_LEVELS } = require('./utils/logger');
const { SUCCESS_MESSAGES, ERROR_MESSAGES } = require('./constants');
const { handleError, withErrorHandling, NetworkError } = require('./helpers/errorHandler');

class DWZDiscordBot {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.initializeBot();
    }

    /**
     * Initialize the Discord bot
     * @private
     */
    initializeBot() {
        try {
            this._createClient();
            this._setupCollections();
            this._registerEventHandlers();
            
        } catch (error) {
            logger.error('Failed to initialize bot', error);
            process.exit(1);
        }
    }

    /**
     * Create Discord client with required intents
     * @private
     */
    _createClient() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent
            ]
        });

        logger.info('Discord client created successfully');
    }

    /**
     * Setup command and event collections
     * @private
     */
    _setupCollections() {
        this.client.commands = new Collection();
        this.client.events = new Collection();
        
        logger.debug('Command and event collections initialized');
    }

    /**
     * Register event handlers for bot lifecycle
     * @private
     */
    _registerEventHandlers() {
        // Graceful shutdown handlers
        process.on('SIGINT', () => this._handleShutdown('SIGINT'));
        process.on('SIGTERM', () => this._handleShutdown('SIGTERM'));
        
        // Unhandled error handlers
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Promise Rejection', { reason, promise });
        });
        
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', error);
            this._handleShutdown('EXCEPTION');
        });
    }

    /**
     * Start the bot by loading commands, events, and logging in
     */
    async start() {
        try {
            logger.info('Starting DWZ Discord Bot...');

            // Load bot components
            await this._loadCommands();
            await this._loadEvents();

            // Login to Discord
            await this._loginToDiscord();

            logger.info(SUCCESS_MESSAGES.BOT_READY);

        } catch (error) {
            const categorizedError = this._categorizeBotError(error);
            handleError(categorizedError, { operation: 'bot_startup' });
            this._handleStartupError(categorizedError);
        }
    }

    /**
     * Load all command files
     * @private
     */
    async _loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        
        if (!this._ensureDirectoryExists(commandsPath, 'commands')) {
            return;
        }

        const commandFiles = fs.readdirSync(commandsPath)
            .filter(file => file.endsWith('.js'));

        logger.info(`Loading ${commandFiles.length} commands...`);

        for (const file of commandFiles) {
            await this._loadSingleCommand(commandsPath, file);
        }

        logger.info(`Successfully loaded ${this.client.commands.size} commands`);
    }

    /**
     * Load a single command file
     * @private
     * @param {string} commandsPath - Path to commands directory
     * @param {string} file - Command file name
     */
    async _loadSingleCommand(commandsPath, file) {
        const filePath = path.join(commandsPath, file);
        
        try {
            const command = require(filePath);
            
            if (!this._isValidCommand(command)) {
                logger.warn(`Command at ${filePath} is missing required "data" or "execute" property`);
                return;
            }

            this.client.commands.set(command.data.name, command);
            logger.debug(`Loaded command: ${command.data.name}`);

        } catch (error) {
            logger.error(`Error loading command ${file}`, error);
        }
    }

    /**
     * Validate command structure
     * @private
     * @param {Object} command - Command object to validate
     * @returns {boolean} Whether command is valid
     */
    _isValidCommand(command) {
        return command && 
               typeof command === 'object' &&
               'data' in command && 
               'execute' in command &&
               typeof command.execute === 'function';
    }

    /**
     * Load all event files
     * @private
     */
    async _loadEvents() {
        const eventsPath = path.join(__dirname, 'events');
        
        if (!this._ensureDirectoryExists(eventsPath, 'events')) {
            return;
        }

        const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

        logger.info(`Loading ${eventFiles.length} events...`);

        for (const file of eventFiles) {
            await this._loadSingleEvent(eventsPath, file);
        }

        logger.info(`Successfully loaded ${this.client.events.size} events`);
    }

    /**
     * Load a single event file
     * @private
     * @param {string} eventsPath - Path to events directory
     * @param {string} file - Event file name
     */
    async _loadSingleEvent(eventsPath, file) {
        const filePath = path.join(eventsPath, file);
        
        try {
            const event = require(filePath);
            
            if (!this._isValidEvent(event)) {
                logger.warn(`Event at ${filePath} is missing required properties`);
                return;
            }

            // Register event with Discord client
            if (event.once) {
                this.client.once(event.name, (...args) => event.execute(...args, this.client));
            } else {
                this.client.on(event.name, (...args) => event.execute(...args, this.client));
            }
            
            this.client.events.set(event.name, event);
            logger.debug(`Loaded event: ${event.name}`);

        } catch (error) {
            logger.error(`Error loading event ${file}`, error);
        }
    }

    /**
     * Validate event structure
     * @private
     * @param {Object} event - Event object to validate
     * @returns {boolean} Whether event is valid
     */
    _isValidEvent(event) {
        return event && 
               typeof event === 'object' &&
               'name' in event && 
               'execute' in event &&
               typeof event.execute === 'function';
    }

    /**
     * Ensure directory exists, create if it doesn't
     * @private
     * @param {string} dirPath - Directory path
     * @param {string} dirName - Directory name for logging
     * @returns {boolean} Whether directory exists or was created
     */
    _ensureDirectoryExists(dirPath, dirName) {
        if (!fs.existsSync(dirPath)) {
            logger.warn(`${dirName} directory not found, creating...`);
            try {
                fs.mkdirSync(dirPath, { recursive: true });
                logger.info(`Created ${dirName} directory: ${dirPath}`);
                return true;
            } catch (error) {
                logger.error(`Failed to create ${dirName} directory`, error);
                return false;
            }
        }
        return true;
    }

    /**
     * Login to Discord
     * @private
     */
    async _loginToDiscord() {
        const token = process.env.DISCORD_TOKEN;
        
        if (!token) {
            throw new Error('DISCORD_TOKEN environment variable is not set');
        }

        logger.info('Logging in to Discord...');
        await this.client.login(token);
    }

    /**
     * Categorize bot startup errors
     * @private
     * @param {Error} error - Original error
     * @returns {Error} Categorized error
     */
    _categorizeBotError(error) {
        if (error.code === 'TokenInvalid') {
            return new Error(ERROR_MESSAGES.INVALID_TOKEN);
        }
        
        if (error.message.includes('Privileged intent') || error.message.includes('disallowed intents')) {
            return new Error('Privileged intents are not enabled for this bot');
        }
        
        if (error.message.includes('TOKEN_INVALID')) {
            return new Error(ERROR_MESSAGES.INVALID_TOKEN);
        }
        
        return error;
    }

    /**
     * Handle startup errors with appropriate user messages
     * @private
     * @param {Error} error - Categorized error
     */
    _handleStartupError(error) {
        if (error.message === ERROR_MESSAGES.INVALID_TOKEN) {
            logger.error('🔑 Invalid bot token. Please check your DISCORD_TOKEN in .env file.');
        } else if (error.message.includes('Privileged intent')) {
            logger.error('🛡️  Privileged intents error!');
            logger.error('');
            logger.error('This happens when the bot tries to use privileged intents that are not enabled.');
            logger.error('');
            logger.error('Quick fix:');
            logger.error('1. Go to https://discord.com/developers/applications');
            logger.error('2. Select your application → Bot');
            logger.error('3. Enable "Message Content Intent" (if not already enabled)');
            logger.error('4. If you need member info, enable "Server Members Intent"');
            logger.error('');
            logger.error('Or see INTENTS.md for detailed instructions.');
        } else {
            logger.error('❌ Unexpected startup error:', error.message);
        }
        
        process.exit(1);
    }

    /**
     * Handle graceful shutdown
     * @private
     * @param {string} signal - Signal that triggered shutdown
     */
    _handleShutdown(signal) {
        logger.info(`Received ${signal}. Initiating graceful shutdown...`);
        
        if (this.client && this.client.destroy) {
            this.client.destroy();
            logger.info('Discord client destroyed');
        }
        
        logger.info('Bot shutdown completed');
        process.exit(0);
    }

    /**
     * Get bot statistics
     * @returns {Object} Bot statistics
     */
    getStats() {
        if (!this.client || !this.isReady) {
            return {
                ready: false,
                guilds: 0,
                users: 0,
                commands: this.client?.commands?.size || 0
            };
        }

        return {
            ready: true,
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            commands: this.client.commands.size,
            uptime: this.client.uptime
        };
    }
}

// Create and start the bot
const bot = new DWZDiscordBot();

// Make bot available globally for shutdown handlers
global.dwzBot = bot;

// Start the bot
bot.start().catch(error => {
    logger.error('Failed to start bot', error);
    process.exit(1);
});

module.exports = DWZDiscordBot;
