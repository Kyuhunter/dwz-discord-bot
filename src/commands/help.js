/**
 * Help Command - Refactored for Clean Code Standards
 * Displays available commands and bot information
 */

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { EMBED_COLORS, EXTERNAL_URLS } = require('../constants');
const { logger } = require('../utils/logger');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows all available commands and bot information'),
    
    /**
     * Execute the help command
     * @param {Interaction} interaction - Discord interaction object
     */
    async execute(interaction) {
        logger.logCommandExecution('help', interaction.user.id);
        
        try {
            const embed = _createHelpEmbed(interaction);
            await interaction.reply({ embeds: [embed] });
            
            logger.info('Help command completed successfully', {
                userId: interaction.user.id
            });
            
        } catch (error) {
            logger.error('Help command failed', {
                userId: interaction.user.id,
                error: error.message
            });
            throw error;
        }
    }
};

/**
 * Create help embed with command information
 * @private
 * @param {Interaction} interaction - Discord interaction
 * @returns {EmbedBuilder} Help embed
 */
function _createHelpEmbed(interaction) {
    const embed = new EmbedBuilder()
        .setColor(EMBED_COLORS.INFO)
        .setTitle('🤖 DWZ Bot Hilfe')
        .setDescription('Hier sind alle verfügbaren Befehle, die Sie verwenden können:')
        .addFields(_getCommandFields())
        .addFields(_getUsageExamplesField())
        .addFields(_getSupportField())
        .setFooter({ 
            text: `Angefordert von ${interaction.user.tag}`, 
            iconURL: interaction.user.displayAvatarURL() 
        })
        .setTimestamp();

    return embed;
}

/**
 * Get command fields for the help embed
 * @private
 * @returns {Array} Array of command field objects
 */
function _getCommandFields() {
    return [
        { 
            name: '📡 `/ping`', 
            value: 'Überprüft die Bot-Latenz und Antwortzeit', 
            inline: true 
        },
        { 
            name: '❓ `/help`', 
            value: 'Zeigt diese Hilfemeldung an', 
            inline: true 
        },
        { 
            name: '📊 `/info`', 
            value: 'Zeigt Bot- und Server-Informationen an', 
            inline: true 
        },
        { 
            name: '♟️ `/dwz`', 
            value: 'Sucht nach der DWZ-Wertung eines Schachspielers', 
            inline: false 
        }
    ];
}

/**
 * Get usage examples field
 * @private
 * @returns {Object} Usage examples field object
 */
function _getUsageExamplesField() {
    return {
        name: '💡 Verwendungsbeispiele',
        value: '**DWZ-Suche:**\n' +
               '• `/dwz name:Müller` - Sucht alle Spieler namens Müller\n' +
               '• `/dwz name:Schmidt club:München` - Sucht Schmidt in München\n' +
               '• `/dwz name:"Müller, Hans"` - Sucht spezifisch Hans Müller\n' +
               '• `/dwz name:Wagner club:SV` - Sucht Wagner in SV-Vereinen',
        inline: false
    };
}

/**
 * Get support information field
 * @private
 * @returns {Object} Support field object
 */
function _getSupportField() {
    return {
        name: '🔗 Zusätzliche Informationen',
        value: `**Datenquelle:** [Deutscher Schachbund](${EXTERNAL_URLS.SCHACHBUND_BASE})\n` +
               '**DWZ:** Deutsche Wertungszahl (Deutsches Elo-Rating-System)\n' +
               '**Hinweis:** Alle Daten stammen von der offiziellen DSB-Website',
        inline: false
    };
}
