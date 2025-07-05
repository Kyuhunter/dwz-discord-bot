/**
 * Ready Event Handler - Refactored for Clean Code Standards
 * Handles the bot ready event when successfully connected to Discord
 */

const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { SUCCESS_MESSAGES } = require('../constants');

module.exports = {
    name: Events.ClientReady,
    once: true,
    
    /**
     * Execute when the bot is ready
     * @param {Client} client - Discord client instance
     */
    execute(client) {
        // Mark bot as ready
        global.dwzBot.isReady = true;
        
        // Log successful connection
        logger.info(`✅ ${SUCCESS_MESSAGES.BOT_READY}! Logged in as ${client.user.tag}`);
        
        // Log server and user statistics
        const stats = _getConnectionStats(client);
        _logConnectionStats(stats);
        
        // Set bot activity status
        _setBotActivity(client);
        
        // Log additional information if in debug mode
        if (process.env.LOG_LEVEL === '3') {
            _logDebugInformation(client);
        }
    }
};

/**
 * Get connection statistics
 * @private
 * @param {Client} client - Discord client
 * @returns {Object} Connection statistics
 */
function _getConnectionStats(client) {
    return {
        guildCount: client.guilds.cache.size,
        userCount: client.users.cache.size,
        commandCount: client.commands?.size || 0,
        clientId: client.user.id
    };
}

/**
 * Log connection statistics
 * @private
 * @param {Object} stats - Connection statistics
 */
function _logConnectionStats(stats) {
    logger.info(`🆔 Client ID: ${stats.clientId}`);
    logger.info(`📊 Serving ${stats.guildCount} server(s)`);
    logger.info(`👥 Watching ${stats.userCount} user(s)`);
    logger.info(`⚡ Loaded ${stats.commandCount} command(s)`);
    
    if (stats.guildCount === 0) {
        logger.warn('⚠️  Bot is not in any servers. Invite it to a server first.');
        logger.info('💡 Use the Discord Developer Portal to generate an invite link.');
    }
}

/**
 * Set bot activity status
 * @private
 * @param {Client} client - Discord client
 */
function _setBotActivity(client) {
    try {
        client.user.setActivity('♟️ Ready to find DWZ ratings!', { 
            type: 'PLAYING' 
        });
        logger.debug('Bot activity status set successfully');
    } catch (error) {
        logger.warn('Failed to set bot activity status', error.message);
    }
}

/**
 * Log additional debug information
 * @private
 * @param {Client} client - Discord client
 */
function _logDebugInformation(client) {
    logger.debug('=== DEBUG INFORMATION ===');
    
    // Log guild details
    if (client.guilds.cache.size > 0) {
        logger.debug('Connected servers:');
        client.guilds.cache.forEach(guild => {
            logger.debug(`  - ${guild.name} (ID: ${guild.id}, Members: ${guild.memberCount})`);
        });
    }
    
    // Log available commands
    if (client.commands && client.commands.size > 0) {
        logger.debug('Available commands:');
        client.commands.forEach(command => {
            logger.debug(`  - /${command.data.name}: ${command.data.description}`);
        });
    }
    
    // Log bot permissions (if available)
    const botUser = client.user;
    if (botUser) {
        logger.debug(`Bot user: ${botUser.tag} (${botUser.id})`);
        logger.debug(`Bot discriminator: ${botUser.discriminator}`);
        logger.debug(`Bot created: ${botUser.createdAt.toISOString()}`);
    }
    
    logger.debug('=== END DEBUG INFORMATION ===');
}
