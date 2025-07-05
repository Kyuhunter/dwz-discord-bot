/**
 * Interaction Create Event Handler - Refactored for Clean Code Standards
 * Handles slash command interactions
 */

const { Events } = require('discord.js');
const { logger } = require('../utils/logger');
const { handleError, withErrorHandling } = require('../helpers/errorHandler');

module.exports = {
    name: Events.InteractionCreate,
    
    /**
     * Execute when an interaction is created
     * @param {Interaction} interaction - Discord interaction object
     */
    execute: withErrorHandling(async (interaction) => {
        // Only handle slash commands
        if (!interaction.isChatInputCommand()) {
            return;
        }

        await _handleSlashCommand(interaction);
        
    }, 'interaction_handling')
};

/**
 * Handle slash command interaction
 * @private
 * @param {Interaction} interaction - Discord interaction
 */
async function _handleSlashCommand(interaction) {
    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
        logger.warn(`Unknown command attempted: ${interaction.commandName}`, {
            userId: interaction.user.id,
            guildId: interaction.guild?.id
        });
        
        await _respondWithUnknownCommand(interaction);
        return;
    }

    // Log command execution attempt
    logger.logCommandExecution(
        interaction.commandName, 
        interaction.user.id, 
        _getCommandOptions(interaction)
    );

    try {
        // Execute the command with timeout protection
        await _executeCommandWithTimeout(command, interaction);
        
    } catch (error) {
        await _handleCommandError(interaction, command, error);
    }
}

/**
 * Get command options for logging
 * @private
 * @param {Interaction} interaction - Discord interaction
 * @returns {Object} Command options
 */
function _getCommandOptions(interaction) {
    const options = {};
    
    if (interaction.options) {
        // Extract option values for logging (be careful with sensitive data)
        interaction.options.data.forEach(option => {
            // Only log non-sensitive option names and types, not values
            options[option.name] = {
                type: option.type,
                hasValue: option.value !== undefined
            };
        });
    }
    
    return {
        options,
        guildId: interaction.guild?.id,
        channelId: interaction.channel?.id
    };
}

/**
 * Execute command with timeout protection
 * @private
 * @param {Object} command - Command object
 * @param {Interaction} interaction - Discord interaction
 */
async function _executeCommandWithTimeout(command, interaction) {
    const COMMAND_TIMEOUT = 30000; // 30 seconds
    
    const commandPromise = command.execute(interaction);
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
            reject(new Error(`Command ${interaction.commandName} timed out after ${COMMAND_TIMEOUT}ms`));
        }, COMMAND_TIMEOUT);
    });
    
    await Promise.race([commandPromise, timeoutPromise]);
    
    logger.info(`Command completed successfully: ${interaction.commandName}`, {
        userId: interaction.user.id,
        duration: Date.now() - interaction.createdTimestamp
    });
}

/**
 * Handle command execution errors
 * @private
 * @param {Interaction} interaction - Discord interaction
 * @param {Object} command - Command that failed
 * @param {Error} error - Error that occurred
 */
async function _handleCommandError(interaction, command, error) {
    const errorContext = {
        commandName: interaction.commandName,
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
        error: error.message
    };

    handleError(error, errorContext);

    // Determine appropriate user response
    const errorResponse = _createErrorResponse(error, interaction.commandName);
    
    try {
        // Try to respond to the user
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(errorResponse);
        } else {
            await interaction.reply(errorResponse);
        }
    } catch (responseError) {
        logger.error('Failed to send error response to user', {
            originalError: error.message,
            responseError: responseError.message,
            userId: interaction.user.id
        });
    }
}

/**
 * Create appropriate error response for user
 * @private
 * @param {Error} error - Error that occurred
 * @param {string} commandName - Name of the command that failed
 * @returns {Object} Discord response object
 */
function _createErrorResponse(error, commandName) {
    let errorMessage = 'Es ist ein unerwarteter Fehler aufgetreten.';
    let canRetry = true;

    // Customize message based on error type
    if (error.message.includes('timeout')) {
        errorMessage = 'Der Befehl hat zu lange gedauert. Bitte versuchen Sie es erneut.';
    } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorMessage = 'Verbindungsproblem. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.';
    } else if (error.message.includes('validation')) {
        errorMessage = 'Ungültige Eingabe. Bitte überprüfen Sie Ihre Parameter und versuchen Sie es erneut.';
        canRetry = false;
    }

    const response = {
        content: `❌ **Fehler beim Ausführen von \`/${commandName}\`**\n\n${errorMessage}`,
        ephemeral: true
    };

    if (canRetry) {
        response.content += '\n\n💡 Sie können den Befehl erneut versuchen.';
    }

    return response;
}

/**
 * Respond to unknown command attempts
 * @private
 * @param {Interaction} interaction - Discord interaction
 */
async function _respondWithUnknownCommand(interaction) {
    const response = {
        content: `❌ **Unbekannter Befehl:** \`/${interaction.commandName}\`\n\n` +
                 'Verwenden Sie `/help` um alle verfügbaren Befehle zu sehen.',
        ephemeral: true
    };

    try {
        await interaction.reply(response);
    } catch (error) {
        logger.error('Failed to respond to unknown command', {
            commandName: interaction.commandName,
            userId: interaction.user.id,
            error: error.message
        });
    }
}
