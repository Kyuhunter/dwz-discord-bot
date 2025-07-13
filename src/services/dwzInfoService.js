/**
 * DWZ Info Python Wrapper Service
 * Interfaces with the dwz-info Python package for DWZ data retrieval
 */

const { spawn } = require('child_process');
const path = require('path');
const { logger } = require('../utils/logger');
const { validatePlayerName, validateClubName } = require('../validators');
const { ERROR_MESSAGES, LIMITS } = require('../constants');

class DWZInfoService {
    constructor() {
        this.pythonScriptPath = path.join(__dirname, '../../dwz_player_search.py');
        this.timeout = LIMITS.SEARCH_TIMEOUT_MS || 15000; // 15 seconds for Python script
    }

    /**
     * Search for DWZ players using the Python dwz-info package
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

        logger.debug('DWZ search request', { playerName: sanitizedPlayerName, clubFilter: sanitizedClubName });

        try {
            const result = await this._callPythonScript(sanitizedPlayerName, sanitizedClubName);
            
            // Check if we have valid player data, even if there's an "error" message
            const players = this._convertToPlayerArray(result);
            
            // If we found players, return them even if Python script reported an "error"
            if (players.length > 0) {
                return this.addDisambiguationInfo(players);
            }
            
            // Only throw error if we truly have no results
            if (result.error && !result.players && !result.player) {
                throw new Error(result.error);
            }
            
            return [];

        } catch (error) {
            logger.error('DWZ search failed via Python package', {
                playerName: sanitizedPlayerName,
                clubFilter: sanitizedClubName,
                error: error.message
            });
            throw this._handleSearchError(error);
        }
    }

    /**
     * Get detailed player information by player ID
     * @param {string} playerId - Player's ID identifier  
     * @returns {Promise<Object>} Detailed player information
     */
    async getPlayerDetails(playerId) {
        if (!playerId || typeof playerId !== 'string') {
            throw new Error('Invalid player ID provided');
        }

        logger.debug(`Fetching player details for ID: ${playerId}`);

        try {
            const result = await this._callPythonScript(null, null, playerId);
            
            if (result.error) {
                throw new Error(result.error);
            }

            return this._convertPlayerDetails(result);

        } catch (error) {
            logger.error(`Failed to fetch player details for ID ${playerId}`, error.message);
            throw this._handleSearchError(error);
        }
    }

    /**
     * Call the Python dwz-info script
     * @private
     * @param {string|null} playerName - Player name to search
     * @param {string|null} clubName - Club name filter
     * @param {string|null} playerId - Direct player ID lookup
     * @returns {Promise<Object>} Python script result
     */
    async _callPythonScript(playerName = null, clubName = null, playerId = null) {
        return new Promise((resolve, reject) => {
            const args = ['--format', 'json'];
            
            if (playerId) {
                args.push('--player-id', playerId);
            } else {
                if (!playerName) {
                    reject(new Error('Player name or player ID required'));
                    return;
                }
                args.push(playerName);
                if (clubName) {
                    args.push(clubName);
                }
            }

            logger.debug('Calling Python script with args:', args);

            const pythonProcess = spawn('python3', [this.pythonScriptPath, ...args], {
                timeout: this.timeout,
                killSignal: 'SIGTERM'
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (parseError) {
                        logger.error('Failed to parse Python script output:', parseError.message);
                        logger.debug('Raw stdout:', stdout);
                        reject(new Error('Failed to parse search results'));
                    }
                } else if (code === 1 && stdout.trim().startsWith('{')) {
                    // Python script exits with code 1 for multiple players or errors
                    // but still returns valid JSON, so we should parse it
                    try {
                        const result = JSON.parse(stdout);
                        resolve(result);
                    } catch (parseError) {
                        logger.error('Failed to parse Python script output on code 1:', parseError.message);
                        logger.error('stderr:', stderr);
                        reject(new Error('Search failed'));
                    }
                } else {
                    logger.error('Python script failed with code:', code);
                    logger.error('stderr:', stderr);
                    
                    // Try to parse error from stderr
                    let errorMessage = 'Search failed';
                    if (stderr.includes('No player found')) {
                        errorMessage = ERROR_MESSAGES.NO_PLAYERS_FOUND;
                    } else if (stderr.includes('Connection') || stderr.includes('network')) {
                        errorMessage = ERROR_MESSAGES.CONNECTION_ERROR;
                    } else if (stderr.includes('timeout') || stderr.includes('Timeout')) {
                        errorMessage = ERROR_MESSAGES.TIMEOUT_ERROR;
                    }
                    
                    reject(new Error(errorMessage));
                }
            });

            pythonProcess.on('error', (error) => {
                if (error.code === 'ENOENT') {
                    reject(new Error('Python3 not found. Please ensure Python 3 is installed.'));
                } else {
                    reject(error);
                }
            });
        });
    }

    /**
     * Convert Python result to array of player objects for search results
     * @private
     * @param {Object} pythonResult - Result from Python script
     * @returns {Array} Array of player objects
     */
    _convertToPlayerArray(pythonResult) {
        // Handle error responses
        if (pythonResult.error && !pythonResult.players) {
            return [];
        }

        // Handle multiple players response
        if (pythonResult.players && Array.isArray(pythonResult.players)) {
            return pythonResult.players.map(p => this._convertSinglePlayer(p));
        }

        // Handle single player response
        if (pythonResult.player) {
            const player = this._convertSinglePlayer(pythonResult.player);
            return [player];
        }

        // No players found
        return [];
    }

    /**
     * Convert single player from Python format to bot format
     * @private
     * @param {Object} pythonPlayer - Player object from Python script
     * @returns {Object} Converted player object
     */
    _convertSinglePlayer(pythonPlayer) {
        return {
            name: pythonPlayer.name || pythonPlayer.full_name || 'Unknown',
            dwz: pythonPlayer.dwz || pythonPlayer.current_dwz || null,
            club: pythonPlayer.club || pythonPlayer.verein || null,
            zpk: pythonPlayer.player_id || pythonPlayer.id || pythonPlayer.zpk || null,
            hasNameDuplicate: false, // Will be set later if needed
            disambiguationInfo: null,
            // Additional fields from Python script
            fide_rating: pythonPlayer.fide_elo || pythonPlayer.elo || pythonPlayer.fide_rating || null,
            fide_title: pythonPlayer.fide_titel || pythonPlayer.fide_title || null,
            nationality: pythonPlayer.fide_nation || pythonPlayer.nationality || null
        };
    }

    /**
     * Convert player details from Python format
     * @private
     * @param {Object} pythonResult - Detailed result from Python script
     * @returns {Object} Converted player details
     */
    _convertPlayerDetails(pythonResult) {
        if (!pythonResult.player) {
            throw new Error('No player data in result');
        }

        const player = pythonResult.player;
        const tournaments = this._convertTournaments(player.tournaments || []);

        return {
            zpk: player.id || player.player_id || player.zpk,
            name: player.name || player.full_name,
            dwz: player.dwz || player.current_dwz,
            club: player.club || player.verein,
            fide_rating: player.fide_rating,
            fide_title: player.fide_titel,
            nationality: player.nationality,
            tournaments: tournaments
        };
    }

    /**
     * Convert tournament data from Python format to bot format
     * @private
     * @param {Array} pythonTournaments - Tournament array from Python script
     * @returns {Array} Converted tournament array
     */
    _convertTournaments(pythonTournaments) {
        return pythonTournaments.map((tournament, index) => ({
            index: index,
            turniername: tournament.tournament_name || tournament.name || `Tournament ${index + 1}`,
            dwzalt: tournament.dwz_old || tournament.dwz_before || '0',
            dwzneu: tournament.dwz_new || tournament.dwz_after || '0',
            partien: tournament.games || tournament.partien || '0',
            punkte: tournament.points || tournament.punkte || '0',
            datum: tournament.date || tournament.datum || '',
            leistung: tournament.leistung || tournament.performance || null
        }));
    }

    /**
     * Handle search errors with appropriate error types
     * @private
     * @param {Error} error - Original error
     * @returns {Error} Processed error
     */
    _handleSearchError(error) {
        const message = error.message.toLowerCase();
        
        if (message.includes('no player found') || message.includes('keine spieler')) {
            return new Error(ERROR_MESSAGES.NO_PLAYERS_FOUND);
        } else if (message.includes('connection') || message.includes('network')) {
            return new Error(ERROR_MESSAGES.CONNECTION_ERROR);
        } else if (message.includes('timeout')) {
            return new Error(ERROR_MESSAGES.TIMEOUT_ERROR);
        } else if (message.includes('python')) {
            return new Error('DWZ service unavailable (Python dependency error)');
        }
        
        return error;
    }

    /**
     * Add disambiguation information for players with duplicate names
     * @param {Array} players - Array of player objects
     * @returns {Array} Players with disambiguation info added
     */
    addDisambiguationInfo(players) {
        const nameGroups = {};
        
        // Group players by name
        players.forEach(player => {
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

        return players;
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

        if (player.fide_rating) {
            parts.push(`FIDE: ${player.fide_rating}`);
        }

        return parts.length > 0 ? parts.join(', ') : 'Keine zusätzlichen Informationen verfügbar';
    }
}

module.exports = DWZInfoService;
