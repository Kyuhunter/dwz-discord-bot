/**
 * Discord Embed Service
 * Handles creation of Discord embeds for various bot responses
 */

const { EmbedBuilder } = require('discord.js');
const { EMBED_COLORS, EXTERNAL_URLS, LIMITS, ERROR_MESSAGES } = require('../constants');
const config = require('../utils/config');
const { logger } = require('../utils/logger');

class EmbedService {
    /**
     * Create error embed
     * @param {string} title - Error title
     * @param {string} description - Error description
     * @param {Object} options - Additional options
     * @returns {EmbedBuilder} Error embed
     */
    createErrorEmbed(title, description, options = {}) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle(`❌ ${title}`)
            .setDescription(description);

        if (options.fields) {
            embed.addFields(options.fields);
        }

        if (options.footer !== false) {
            this._addFooter(embed, options.footerText);
        }

        return embed;
    }

    /**
     * Create success embed
     * @param {string} title - Success title
     * @param {string} description - Success description
     * @param {Object} options - Additional options
     * @returns {EmbedBuilder} Success embed
     */
    createSuccessEmbed(title, description, options = {}) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.SUCCESS)
            .setTitle(`✅ ${title}`)
            .setDescription(description);

        if (options.fields) {
            embed.addFields(options.fields);
        }

        if (options.footer !== false) {
            this._addFooter(embed, options.footerText);
        }

        return embed;
    }

    /**
     * Create info embed
     * @param {string} title - Info title
     * @param {string} description - Info description
     * @param {Object} options - Additional options
     * @returns {EmbedBuilder} Info embed
     */
    createInfoEmbed(title, description, options = {}) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.INFO)
            .setTitle(title)
            .setDescription(description);

        if (options.fields) {
            embed.addFields(options.fields);
        }

        if (options.footer !== false) {
            this._addFooter(embed, options.footerText);
        }

        return embed;
    }

    /**
     * Create "no players found" embed
     * @param {string} searchQuery - The search query that returned no results
     * @param {boolean} hasClubFilter - Whether a club filter was used
     * @returns {EmbedBuilder} No players found embed
     */
    createNoPlayersFoundEmbed(searchQuery, hasClubFilter = false) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.ERROR)
            .setTitle('🔍 Keine Spieler gefunden')
            .setDescription(`Keine Spieler gefunden für: **${searchQuery}**`);

        const searchTips = [
            '• Überprüfen Sie die Schreibweise',
            '• Verwenden Sie nur den Nachnamen',
            '• Versuchen Sie alternative Schreibweisen'
        ];

        if (hasClubFilter) {
            searchTips.push('• Überprüfen Sie den Vereinsnamen oder lassen Sie das Club-Feld leer');
        } else {
            searchTips.push('• Verwenden Sie das Club-Feld für präzisere Suche');
        }

        embed.addFields({
            name: '💡 Suchtipps',
            value: searchTips.join('\n')
        });

        embed.addFields({
            name: '🔗 Direkte Suche',
            value: `[Direkt auf schachbund.de suchen](${EXTERNAL_URLS.SCHACHBUND_PLAYER_SEARCH}?search=${encodeURIComponent(searchQuery)})`
        });

        this._addFooter(embed);
        return embed;
    }

    /**
     * Create multiple players found embed
     * @param {Array} players - Array of found players
     * @param {string} searchQuery - The search query
     * @returns {EmbedBuilder} Multiple players embed
     */
    createMultiplePlayersEmbed(players, searchQuery) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.INFO)
            .setTitle('🔍 Mehrere Spieler gefunden')
            .setDescription(`Gefunden: **${players.length}** Spieler für "${searchQuery}"`);

        const maxResults = LIMITS.MAX_SEARCH_RESULTS;
        const resultsToShow = players.slice(0, maxResults);
        
        // Check if there are any players with duplicate names
        const hasDuplicateNames = resultsToShow.some(player => player.hasNameDuplicate);
        if (hasDuplicateNames) {
            this._addDuplicateNamesHint(embed);
        }
        
        // Add player fields
        for (const player of resultsToShow) {
            this._addPlayerField(embed, player);
        }

        // Add "more results" message if needed
        if (players.length > maxResults) {
            embed.addFields({
                name: '📋 Weitere Ergebnisse',
                value: `Es gibt ${players.length - maxResults} weitere Spieler. Verwenden Sie einen spezifischeren Suchbegriff oder Vereinsnamen.`,
                inline: false
            });
        }

        // Add footer with search tips
        embed.setFooter({
            text: 'Daten von schachbund.de • Tipp: Nutzen Sie das "club" Feld für präzise Suche',
            iconURL: EXTERNAL_URLS.SCHACHBUND_FAVICON
        });

        return embed;
    }

    /**
     * Create single player details embed
     * @param {Object} player - Player object with detailed information
     * @returns {Object} Response object with embed and files
     */
    async createPlayerDetailsEmbed(player) {
        const embed = new EmbedBuilder()
            .setColor(EMBED_COLORS.SUCCESS)
            .setTitle(`♟️ ${player.name}`)
            .setDescription('DWZ-Informationen vom Deutschen Schachbund');

        // Add basic information
        this._addPlayerBasicInfo(embed, player);

        // Add tournament statistics if available
        if (player.tournaments && player.tournaments.length > 0) {
            this._addTournamentStatistics(embed, player.tournaments);
        }

        this._addFooter(embed);

        // Generate chart if possible
        const chartAttachment = await this._generateChartIfPossible(player);

        return {
            embeds: [embed],
            files: chartAttachment ? [chartAttachment] : []
        };
    }

    /**
     * Add duplicate names hint to embed
     * @private
     * @param {EmbedBuilder} embed - Embed to modify
     */
    _addDuplicateNamesHint(embed) {
        embed.addFields({
            name: '💡 Tipp für eindeutige Suche',
            value: 'Bei mehreren Spielern mit gleichem Namen verwenden Sie das **club** Feld:\n' +
                   '• `/dwz name:Schmidt club:München` - Sucht Schmidt in München\n' +
                   '• `/dwz name:Müller club:SV` - Sucht Müller in einem SV-Verein\n' +
                   '• `/dwz name:Wagner club:Berlin` - Sucht Wagner in Berlin\n\n' +
                   'Oder kombiniert: `/dwz name:"Schmidt München"` (alte Syntax weiterhin verfügbar)',
            inline: false
        });
    }

    /**
     * Add player field to embed
     * @private
     * @param {EmbedBuilder} embed - Embed to modify
     * @param {Object} player - Player object
     */
    _addPlayerField(embed, player) {
        const dwzText = player.dwz ? `🏆 DWZ ${player.dwz}` : '🏆 Keine DWZ';
        const clubText = player.club ? `\n🏛️ ${player.club}` : '\n🏛️ Verein unbekannt';
        
        let valueText = `${dwzText}${clubText}`;
        
        // Add disambiguation info for duplicate names
        if (player.hasNameDuplicate && player.disambiguationInfo) {
            valueText += `\n\n**Unterscheidung:** ${player.disambiguationInfo}`;
        }
        
        embed.addFields({
            name: player.name,
            value: valueText,
            inline: true
        });
    }

    /**
     * Add player basic information to embed
     * @private
     * @param {EmbedBuilder} embed - Embed to modify
     * @param {Object} player - Player object
     */
    _addPlayerBasicInfo(embed, player) {
        if (player.dwz) {
            embed.addFields({
                name: '🏆 Aktuelle DWZ',
                value: player.dwz.toString(),
                inline: true
            });
        }

        if (player.fide_rating) {
            embed.addFields({
                name: '🌍 FIDE Wertung',
                value: player.fide_rating.toString(),
                inline: true
            });
        }

        if (player.fide_title) {
            embed.addFields({
                name: '👑 FIDE Titel',
                value: player.fide_title,
                inline: true
            });
        }

        if (player.club) {
            embed.addFields({
                name: '🏛️ Verein',
                value: player.club,
                inline: true
            });
        }

        if (player.nationality) {
            embed.addFields({
                name: '🏳️ Nationalität',
                value: player.nationality,
                inline: true
            });
        }

        if (player.zpk) {
            embed.addFields({
                name: '🆔 ZPK',
                value: player.zpk,
                inline: true
            });
        }
    }

    /**
     * Add tournament statistics to embed
     * @private
     * @param {EmbedBuilder} embed - Embed to modify
     * @param {Array} tournaments - Tournament data
     */
    _addTournamentStatistics(embed, tournaments) {
        const validTournaments = tournaments.filter(t => 
            t.dwzneu && t.dwzneu !== '0' && !isNaN(parseInt(t.dwzneu))
        );

        if (validTournaments.length === 0) return;

        // Calculate additional statistics
        const dwzValues = validTournaments.map(t => parseInt(t.dwzneu));
        const maxDwz = Math.max(...dwzValues);
        const minDwz = Math.min(...dwzValues);
        const currentDwz = dwzValues[dwzValues.length - 1];
        
        // Calculate total games and points
        let totalGames = 0;
        let totalPoints = 0;
        validTournaments.forEach(t => {
            if (t.partien && !isNaN(parseFloat(t.partien))) {
                totalGames += parseInt(t.partien);
            }
            if (t.punkte && !isNaN(parseFloat(t.punkte))) {
                totalPoints += parseFloat(t.punkte);
            }
        });

        let statsText = `**Turniere gespielt:** ${validTournaments.length}\n`;
        statsText += `**Aktuelle DWZ:** ${currentDwz}`;
        
        if (maxDwz !== minDwz) {
            statsText += `\n**Höchste DWZ:** ${maxDwz}`;
            statsText += `\n**Niedrigste DWZ:** ${minDwz}`;
        }
        
        if (totalGames > 0) {
            statsText += `\n**Partien gesamt:** ${totalGames}`;
            if (totalPoints > 0) {
                const percentage = ((totalPoints / totalGames) * 100).toFixed(1);
                statsText += `\n**Punkte gesamt:** ${totalPoints} (${percentage}%)`;
            }
        }

        // Add performance rating from latest tournament if available
        const latestTournament = validTournaments[validTournaments.length - 1];
        if (latestTournament.leistung && latestTournament.leistung !== '0') {
            statsText += `\n**Letzte Leistung:** ${latestTournament.leistung}`;
        }

        embed.addFields({
            name: '📊 Turnierstatistiken',
            value: statsText,
            inline: false
        });
    }

    /**
     * Generate chart if possible
     * @private
     * @param {Object} player - Player object
     * @returns {Promise<Object|null>} Chart attachment or null
     */
    async _generateChartIfPossible(player) {
        try {
            const { generateDWZChart } = require('../utils/chartGenerator');
            return await generateDWZChart(player.tournaments, player.name);
        } catch (error) {
            logger.error('Failed to generate chart', error);
            return null;
        }
    }

    /**
     * Add footer to embed
     * @private
     * @param {EmbedBuilder} embed - Embed to modify
     * @param {string} customText - Custom footer text
     */
    _addFooter(embed, customText = null) {
        const footerText = customText || 'Daten von schachbund.de';
        embed.setFooter({
            text: footerText,
            iconURL: EXTERNAL_URLS.SCHACHBUND_FAVICON
        });
    }
}

module.exports = EmbedService;
