/**
 * DWZ Search Service
 * Handles all interactions with the German Chess Federation website
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { EXTERNAL_URLS, LIMITS, ERROR_MESSAGES } = require('../constants');
const { logger } = require('../utils/logger');
const { validatePlayerName, validateClubName, sanitizeSearchInput } = require('../validators');

class DWZSearchService {
    constructor() {
        this.baseURL = EXTERNAL_URLS.SCHACHBUND_BASE;
        this.searchEndpoint = `${this.baseURL}/spieler.html`;
        this.timeout = LIMITS.SEARCH_TIMEOUT_MS;
    }

    /**
     * Search for DWZ players
     * @param {string} playerName - Name of the player to search for
     * @param {string|null} clubFilter - Optional club filter
     * @returns {Promise<Array>} Array of player objects
     */
    async searchPlayers(playerName, clubFilter = null) {
        // Validate inputs
        const playerValidation = validatePlayerName(playerName);
        if (!playerValidation.isValid) {
            throw new Error(`Invalid player name: ${playerValidation.error}`);
        }

        const clubValidation = validateClubName(clubFilter);
        if (!clubValidation.isValid) {
            throw new Error(`Invalid club name: ${clubValidation.error}`);
        }

        const sanitizedPlayerName = playerValidation.sanitizedValue;
        const sanitizedClubName = clubValidation.sanitizedValue;

        logger.logSearch('DWZ player', sanitizedPlayerName, 0);

        try {
            const { searchTerm, detectedClub } = this._processSearchTerms(sanitizedPlayerName, sanitizedClubName);
            const searchResults = await this._performSearch(searchTerm);
            const filteredResults = this._filterResults(searchResults, detectedClub || sanitizedClubName);
            
            logger.logSearch('DWZ player', sanitizedPlayerName, filteredResults.length);
            return filteredResults;

        } catch (error) {
            logger.error('DWZ search failed', {
                playerName: sanitizedPlayerName,
                clubFilter: sanitizedClubName,
                error: error.message
            });
            throw this._handleSearchError(error);
        }
    }

    /**
     * Get detailed player information by ZPK
     * @param {string} zpk - Player's ZPK identifier
     * @returns {Promise<Object>} Detailed player information
     */
    async getPlayerDetails(zpk) {
        if (!zpk || typeof zpk !== 'string') {
            throw new Error('Invalid ZPK provided');
        }

        logger.debug(`Fetching player details for ZPK: ${zpk}`);

        try {
            const response = await axios.get(`${this.baseURL}/spieler/${zpk}.html`, {
                timeout: this.timeout,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; DWZ-Discord-Bot/1.0)'
                }
            });

            const $ = cheerio.load(response.data);
            return this._parsePlayerDetails($, zpk);

        } catch (error) {
            logger.error(`Failed to fetch player details for ZPK ${zpk}`, error.message);
            throw this._handleSearchError(error);
        }
    }

    /**
     * Process search terms and detect club information
     * @private
     * @param {string} playerName - Player name
     * @param {string|null} explicitClub - Explicit club filter
     * @returns {Object} Processed search terms
     */
    _processSearchTerms(playerName, explicitClub) {
        let searchTerm = playerName;
        let detectedClub = explicitClub;

        // If no explicit club filter, try to detect from player name
        if (!explicitClub) {
            const clubDetection = this._detectClubFromName(playerName);
            if (clubDetection.club) {
                searchTerm = clubDetection.playerName;
                detectedClub = clubDetection.club;
                logger.debug(`Detected club from player name: "${detectedClub}"`);
            }
        }

        return {
            searchTerm: sanitizeSearchInput(searchTerm),
            detectedClub: detectedClub ? sanitizeSearchInput(detectedClub) : null
        };
    }

    /**
     * Detect club information from player name
     * @private
     * @param {string} playerName - Full player name string
     * @returns {Object} Separated player name and club
     */
    _detectClubFromName(playerName) {
        // This method would contain the club detection logic
        // from the original code, refactored for clarity
        const words = playerName.trim().split(/\s+/);
        
        if (words.length < 2) {
            return { playerName, club: null };
        }

        // Simple detection logic (can be enhanced)
        // Look for club keywords in the name
        const { CLUB_PATTERNS } = require('../constants');
        
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const isClubKeyword = CLUB_PATTERNS.KEYWORDS.some(keyword => 
                word.toLowerCase().includes(keyword.toLowerCase())
            );
            
            if (isClubKeyword || CLUB_PATTERNS.CITY_PATTERN.test(word)) {
                return {
                    playerName: words.slice(0, i).join(' '),
                    club: words.slice(i).join(' ')
                };
            }
        }

        return { playerName, club: null };
    }

    /**
     * Perform the actual search request
     * @private
     * @param {string} searchTerm - Term to search for
     * @returns {Promise<Array>} Raw search results
     */
    async _performSearch(searchTerm) {
        const searchURL = `${this.searchEndpoint}?search=${encodeURIComponent(searchTerm)}`;
        
        logger.debug(`Performing search request: ${searchURL}`);

        const response = await axios.get(searchURL, {
            timeout: this.timeout,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DWZ-Discord-Bot/1.0)'
            }
        });

        const $ = cheerio.load(response.data);
        return this._parseSearchResults($);
    }

    /**
     * Parse search results from HTML
     * @private
     * @param {CheerioStatic} $ - Cheerio instance
     * @returns {Array} Parsed player results
     */
    _parseSearchResults($) {
        const results = [];
        
        // This would contain the HTML parsing logic
        // from the original code, cleaned up
        $('table tr').each((index, element) => {
            if (index === 0) return; // Skip header row
            
            const $row = $(element);
            const cells = $row.find('td');
            
            if (cells.length >= 3) {
                const player = this._parsePlayerRow($, cells);
                if (player) {
                    results.push(player);
                }
            }
        });

        return results;
    }

    /**
     * Parse individual player row
     * @private
     * @param {CheerioStatic} $ - Cheerio instance
     * @param {Object} cells - Table cells
     * @returns {Object|null} Parsed player object
     */
    _parsePlayerRow($, cells) {
        try {
            // Extract player information from table cells
            const nameCell = $(cells[0]);
            const dwzCell = $(cells[1]);
            const clubCell = $(cells[2]);

            const name = nameCell.text().trim();
            const dwz = dwzCell.text().trim();
            const club = clubCell.text().trim();

            // Extract ZPK from link if available
            const link = nameCell.find('a').attr('href');
            const zpk = link ? this._extractZPKFromLink(link) : null;

            if (!name) return null;

            return {
                name,
                dwz: dwz || null,
                club: club || null,
                zpk: zpk,
                hasNameDuplicate: false, // Will be set later during deduplication
                disambiguationInfo: null
            };

        } catch (error) {
            logger.warn('Failed to parse player row', error.message);
            return null;
        }
    }

    /**
     * Extract ZPK from player link
     * @private
     * @param {string} link - Player profile link
     * @returns {string|null} Extracted ZPK
     */
    _extractZPKFromLink(link) {
        const zpkMatch = link.match(/\/spieler\/(\d+)\.html/);
        return zpkMatch ? zpkMatch[1] : null;
    }

    /**
     * Filter search results based on club
     * @private
     * @param {Array} results - Raw search results
     * @param {string|null} clubFilter - Club filter
     * @returns {Array} Filtered results
     */
    _filterResults(results, clubFilter) {
        if (!clubFilter) {
            return this._addDisambiguationInfo(results);
        }

        const clubFilterLower = clubFilter.toLowerCase();
        const filtered = results.filter(player => {
            if (!player.club) return false;
            return player.club.toLowerCase().includes(clubFilterLower);
        });

        return this._addDisambiguationInfo(filtered);
    }

    /**
     * Add disambiguation information for players with duplicate names
     * @private
     * @param {Array} results - Player results
     * @returns {Array} Results with disambiguation info
     */
    _addDisambiguationInfo(results) {
        const nameGroups = {};
        
        // Group players by name
        results.forEach(player => {
            if (!nameGroups[player.name]) {
                nameGroups[player.name] = [];
            }
            nameGroups[player.name].push(player);
        });

        // Add disambiguation info for duplicate names
        Object.values(nameGroups).forEach(group => {
            if (group.length > 1) {
                group.forEach(player => {
                    player.hasNameDuplicate = true;
                    player.disambiguationInfo = this._createDisambiguationInfo(player);
                });
            }
        });

        return results;
    }

    /**
     * Create disambiguation information for a player
     * @private
     * @param {Object} player - Player object
     * @returns {string} Disambiguation info
     */
    _createDisambiguationInfo(player) {
        const parts = [];
        
        if (player.club) {
            parts.push(`Verein: ${player.club}`);
        }
        
        if (player.dwz) {
            parts.push(`DWZ: ${player.dwz}`);
        }

        return parts.length > 0 ? parts.join(', ') : 'Keine zusätzlichen Informationen verfügbar';
    }

    /**
     * Parse detailed player information
     * @private
     * @param {CheerioStatic} $ - Cheerio instance
     * @param {string} zpk - Player ZPK
     * @returns {Object} Detailed player information
     */
    _parsePlayerDetails($, zpk) {
        // This would contain the detailed parsing logic
        // from the original code for player details page
        
        const tournaments = [];
        $('table tr').each((index, element) => {
            if (index === 0) return; // Skip header
            
            const tournament = this._parseTournamentRow($, element, index);
            if (tournament) {
                tournaments.push(tournament);
            }
        });

        return {
            zpk,
            tournaments: tournaments.sort((a, b) => a.index - b.index)
        };
    }

    /**
     * Parse tournament row from player details
     * @private
     * @param {CheerioStatic} $ - Cheerio instance
     * @param {Object} element - Table row element
     * @param {number} index - Row index
     * @returns {Object|null} Tournament object
     */
    _parseTournamentRow($, element, index) {
        try {
            const $row = $(element);
            const cells = $row.find('td');
            
            if (cells.length < 6) return null;

            return {
                index,
                turniername: $(cells[0]).text().trim() || `Tournament ${index}`,
                dwzalt: $(cells[1]).text().trim() || '0',
                dwzneu: $(cells[2]).text().trim() || '0',
                partien: $(cells[3]).text().trim() || '0',
                punkte: $(cells[4]).text().trim() || '0',
                datum: $(cells[5]).text().trim() || ''
            };

        } catch (error) {
            logger.warn(`Failed to parse tournament row ${index}`, error.message);
            return null;
        }
    }

    /**
     * Handle search errors with appropriate error types
     * @private
     * @param {Error} error - Original error
     * @returns {Error} Processed error
     */
    _handleSearchError(error) {
        if (error.response?.status === 404) {
            return new Error(ERROR_MESSAGES.SEARCH_UNAVAILABLE);
        } else if (error.code === 'ENOTFOUND') {
            return new Error(ERROR_MESSAGES.CONNECTION_ERROR);
        } else if (error.code === 'ETIMEDOUT') {
            return new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
        }
        
        return error;
    }
}

module.exports = DWZSearchService;
