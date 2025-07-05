/**
 * DWZ Command - Refactored for clean code standards
 * Searches for DWZ ratings from the German Chess Federation
 */

const { SlashCommandBuilder } = require('discord.js');
const { logger } = require('../utils/logger');
const { validatePlayerName, validateClubName } = require('../validators');
const DWZSearchService = require('../services/dwzSearchService');
const EmbedService = require('../services/embedService');
const { ERROR_MESSAGES } = require('../constants');

class DWZCommand {
    constructor() {
        this.searchService = new DWZSearchService();
        this.embedService = new EmbedService();
        
        this.data = new SlashCommandBuilder()
            .setName('dwz')
            .setDescription('Suche nach der DWZ-Wertung eines Schachspielers vom Deutschen Schachbund')
            .addStringOption(option =>
                option.setName('name')
                    .setDescription('Spielername zum Suchen (z.B. "Müller" oder "Schmidt, Hans")')
                    .setRequired(true)
            )
            .addStringOption(option =>
                option.setName('club')
                    .setDescription('Vereinsname zum Filtern (z.B. "München", "SV", "Berlin")')
                    .setRequired(false)
            );
    }

    /**
     * Execute the DWZ command
     * @param {Interaction} interaction - Discord interaction object
     */
    async execute(interaction) {
        const playerName = interaction.options.getString('name');
        const clubName = interaction.options.getString('club');
        
        // Log command execution
        logger.logCommandExecution('dwz', interaction.user.id, { playerName, clubName });
        
        await interaction.deferReply();
        
        try {
            // Validate inputs
            const validationResult = this._validateInputs(playerName, clubName);
            if (!validationResult.isValid) {
                const embed = this.embedService.createErrorEmbed(
                    'Ungültige Eingabe',
                    validationResult.error
                );
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // Perform search
            const searchResults = await this.searchService.searchPlayers(
                validationResult.playerName,
                validationResult.clubName
            );

            // Process results
            await this._handleSearchResults(interaction, searchResults, playerName, clubName);

        } catch (error) {
            logger.error('DWZ command execution failed', {
                playerName,
                clubName,
                userId: interaction.user.id,
                error: error.message
            });

            await this._handleError(interaction, error, playerName, clubName);
        }
    }

    /**
     * Validate command inputs
     * @private
     * @param {string} playerName - Player name input
     * @param {string|null} clubName - Club name input
     * @returns {Object} Validation result
     */
    _validateInputs(playerName, clubName) {
        const playerValidation = validatePlayerName(playerName);
        if (!playerValidation.isValid) {
            return {
                isValid: false,
                error: playerValidation.error
            };
        }

        const clubValidation = validateClubName(clubName);
        if (!clubValidation.isValid) {
            return {
                isValid: false,
                error: clubValidation.error
            };
        }

        return {
            isValid: true,
            playerName: playerValidation.sanitizedValue,
            clubName: clubValidation.sanitizedValue
        };
    }

    /**
     * Handle search results based on count
     * @private
     * @param {Interaction} interaction - Discord interaction
     * @param {Array} searchResults - Search results array
     * @param {string} originalPlayerName - Original player name input
     * @param {string|null} originalClubName - Original club name input
     */
    async _handleSearchResults(interaction, searchResults, originalPlayerName, originalClubName) {
        if (searchResults.length === 0) {
            await this._handleNoResults(interaction, originalPlayerName, originalClubName);
        } else if (searchResults.length === 1) {
            await this._handleSingleResult(interaction, searchResults[0]);
        } else {
            await this._handleMultipleResults(interaction, searchResults, originalPlayerName, originalClubName);
        }
    }

    /**
     * Handle case when no players are found
     * @private
     * @param {Interaction} interaction - Discord interaction
     * @param {string} playerName - Player name that was searched
     * @param {string|null} clubName - Club name that was used as filter
     */
    async _handleNoResults(interaction, playerName, clubName) {
        const searchQuery = clubName ? `${playerName} (Club: ${clubName})` : playerName;
        const embed = this.embedService.createNoPlayersFoundEmbed(searchQuery, !!clubName);
        await interaction.editReply({ embeds: [embed] });
    }

    /**
     * Handle single player result
     * @private
     * @param {Interaction} interaction - Discord interaction
     * @param {Object} player - Player object
     */
    async _handleSingleResult(interaction, player) {
        try {
            // Get detailed player information
            const playerDetails = await this.searchService.getPlayerDetails(player.zpk);
            
            // Merge basic info with detailed info
            const fullPlayerInfo = {
                ...player,
                tournaments: playerDetails.tournaments || []
            };

            // Create detailed embed with chart if possible
            const result = await this.embedService.createPlayerDetailsEmbed(fullPlayerInfo);
            await interaction.editReply(result);

        } catch (error) {
            logger.error('Failed to get player details', {
                playerZpk: player.zpk,
                playerName: player.name,
                error: error.message
            });

            // Fall back to basic player information
            const basicEmbed = this._createBasicPlayerEmbed(player);
            await interaction.editReply({ embeds: [basicEmbed] });
        }
    }

    /**
     * Handle multiple players result
     * @private
     * @param {Interaction} interaction - Discord interaction
     * @param {Array} players - Array of player objects
     * @param {string} playerName - Original player name
     * @param {string|null} clubName - Original club name
     */
    async _handleMultipleResults(interaction, players, playerName, clubName) {
        const searchQuery = clubName ? `${playerName} (Club: ${clubName})` : playerName;
        const embed = this.embedService.createMultiplePlayersEmbed(players, searchQuery);
        await interaction.editReply({ embeds: [embed] });
    }

    /**
     * Create basic player embed (fallback when detailed info fails)
     * @private
     * @param {Object} player - Player object
     * @returns {EmbedBuilder} Basic player embed
     */
    _createBasicPlayerEmbed(player) {
        const fields = [];
        
        if (player.dwz) {
            fields.push({
                name: '🏆 DWZ',
                value: player.dwz,
                inline: true
            });
        }

        if (player.club) {
            fields.push({
                name: '🏛️ Verein',
                value: player.club,
                inline: true
            });
        }

        if (player.zpk) {
            fields.push({
                name: '🆔 ZPK',
                value: player.zpk,
                inline: true
            });
        }

        return this.embedService.createSuccessEmbed(
            `♟️ ${player.name}`,
            'DWZ-Informationen vom Deutschen Schachbund',
            { fields }
        );
    }

    /**
     * Handle command errors
     * @private
     * @param {Interaction} interaction - Discord interaction
     * @param {Error} error - Error object
     * @param {string} playerName - Player name that was searched
     * @param {string|null} clubName - Club name filter
     */
    async _handleError(interaction, error, playerName, clubName) {
        let errorTitle = 'DWZ Suche Fehler';
        let errorDescription = 'Sorry, there was an error searching for the player.';
        let errorDetails = error.message || 'Unknown error occurred';

        // Categorize error types
        if (error.message === ERROR_MESSAGES.SEARCH_UNAVAILABLE) {
            errorTitle = 'Suchservice nicht verfügbar';
            errorDescription = 'Der Suchservice ist vorübergehend nicht verfügbar.';
            errorDetails = 'Die Suchschnittstelle könnte sich geändert haben. Versuchen Sie es später erneut oder suchen Sie direkt auf schachbund.de';
        } else if (error.message === ERROR_MESSAGES.CONNECTION_ERROR) {
            errorTitle = 'Verbindungsfehler';
            errorDescription = 'Kann nicht zu schachbund.de verbinden';
            errorDetails = 'Überprüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut';
        } else if (error.message === ERROR_MESSAGES.TIMEOUT_ERROR) {
            errorTitle = 'Zeitüberschreitung';
            errorDescription = 'Suchanfrage ist abgelaufen';
            errorDetails = 'Der Server antwortet langsam. Bitte versuchen Sie es erneut.';
        }

        const searchQuery = clubName ? `${playerName} (${clubName})` : playerName;
        const embed = this.embedService.createErrorEmbed(errorTitle, errorDescription, {
            fields: [
                {
                    name: 'Fehlerdetails',
                    value: errorDetails
                },
                {
                    name: '🔗 Alternative',
                    value: `[Direkt auf schachbund.de suchen](https://www.schachbund.de/spieler.html?search=${encodeURIComponent(playerName)})`
                }
            ]
        });

        await interaction.editReply({ embeds: [embed] });
    }
}

// Create and export the command instance
const dwzCommand = new DWZCommand();

module.exports = {
    data: dwzCommand.data,
    execute: (interaction) => dwzCommand.execute(interaction)
};
