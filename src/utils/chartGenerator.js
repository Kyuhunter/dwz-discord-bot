const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const { CHART_CONFIG, DWZ_CONSTANTS, LIMITS } = require('../constants');
const { logger } = require('./logger');
const { validateTournamentData } = require('../validators');

// Chart configuration
const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width: CHART_CONFIG.WIDTH, 
    height: CHART_CONFIG.HEIGHT,
    backgroundColour: CHART_CONFIG.BACKGROUND_COLOR
});

/**
 * Generate a DWZ progression chart from tournament data
 * @param {Array} tournaments - Array of tournament objects with DWZ data
 * @param {string} playerName - Name of the player for the chart title
 * @returns {Promise<AttachmentBuilder|null>} - Discord attachment with the chart image or null if insufficient data
 */
async function generateDWZChart(tournaments, playerName) {
    try {
        // Validate input data
        const validation = validateTournamentData(tournaments);
        if (!validation.isValid) {
            logger.warn(`Chart generation skipped for ${playerName}: ${validation.error}`);
            return null;
        }

        logger.logChartGeneration(playerName, tournaments);

        // Filter and sort tournaments
        const sortedTournaments = _prepareTournamentData(tournaments);
        
        if (sortedTournaments.length < LIMITS.MIN_TOURNAMENTS_FOR_CHART) {
            logger.warn(`Insufficient valid tournaments for chart (${sortedTournaments.length} < ${LIMITS.MIN_TOURNAMENTS_FOR_CHART})`);
            return null;
        }

        logger.info(`Proceeding with chart generation for ${playerName} (${sortedTournaments.length} tournaments)`);

        // Prepare chart data
        const chartData = _prepareChartData(sortedTournaments);
        
        // Create chart configuration
        const configuration = _createChartConfiguration(chartData, playerName);
        
        // Generate and save chart
        return await _generateAndSaveChart(configuration);

    } catch (error) {
        logger.error('Error generating DWZ chart', { playerName, error: error.message });
        return null;
    }
}
/**
 * Filter and sort tournament data for chart generation
 * @private
 * @param {Array} tournaments - Raw tournament data
 * @returns {Array} Filtered and sorted tournaments
 */
function _prepareTournamentData(tournaments) {
    return tournaments
        .filter(tournament => {
            // A tournament is valid if it has a valid ending DWZ (dwzneu)
            // The starting DWZ (dwzalt) can be "0" for first tournaments
            const hasValidEndDWZ = tournament.dwzneu && 
                                 tournament.dwzneu !== '0' && 
                                 tournament.dwzneu !== '' && 
                                 !isNaN(parseInt(tournament.dwzneu));
            return hasValidEndDWZ;
        })
        .sort((a, b) => a.index - b.index);
}

/**
 * Prepare data for chart visualization
 * @private
 * @param {Array} sortedTournaments - Sorted tournament data
 * @returns {Object} Chart data with labels and values
 */
function _prepareChartData(sortedTournaments) {
    const labels = [];
    const dwzData = [];
    
    // Find the first tournament with a valid starting DWZ (non-zero dwzalt)
    let chartStartIndex = 0;
    let startingDWZ = null;
    
    for (let i = 0; i < sortedTournaments.length; i++) {
        const tournament = sortedTournaments[i];
        if (tournament.dwzalt && 
            tournament.dwzalt !== '0' && 
            !isNaN(parseInt(tournament.dwzalt))) {
            startingDWZ = parseInt(tournament.dwzalt);
            chartStartIndex = i;
            break;
        }
    }
    
    // If no tournament has a valid starting DWZ, use the first tournament's ending DWZ as start
    if (startingDWZ === null) {
        startingDWZ = parseInt(sortedTournaments[0].dwzneu);
        chartStartIndex = 0;
        // Don't add a "Start" point, just begin with the first tournament
    } else {
        // Add the starting DWZ point
        labels.push('Start');
        dwzData.push(startingDWZ);
    }
    
    // Add DWZ after each tournament, starting from the appropriate index
    for (let i = chartStartIndex; i < sortedTournaments.length; i++) {
        const tournament = sortedTournaments[i];
        const tournamentName = tournament.turniername || `Tournament ${i + 1}`;
        
        // Truncate long tournament names
        const shortName = _truncateTournamentName(tournamentName);
        
        labels.push(shortName);
        dwzData.push(parseInt(tournament.dwzneu));
    }
    
    return { labels, dwzData };
}

/**
 * Truncate tournament name if too long
 * @private
 * @param {string} tournamentName - Original tournament name
 * @returns {string} Truncated tournament name
 */
function _truncateTournamentName(tournamentName) {
    const maxLength = LIMITS.MAX_TOURNAMENT_NAME_LENGTH;
    return tournamentName.length > maxLength 
        ? tournamentName.substring(0, maxLength - 3) + '...' 
        : tournamentName;
}

/**
 * Create Chart.js configuration object
 * @private
 * @param {Object} chartData - Prepared chart data
 * @param {string} playerName - Player name for chart title
 * @returns {Object} Chart.js configuration
 */
function _createChartConfiguration(chartData, playerName) {
    const { labels, dwzData } = chartData;
    
    // Calculate min and max for better chart scaling
    const minDWZ = Math.min(...dwzData);
    const maxDWZ = Math.max(...dwzData);
    const padding = Math.max(
        DWZ_CONSTANTS.MIN_CHART_PADDING, 
        (maxDWZ - minDWZ) * DWZ_CONSTANTS.CHART_PADDING_PERCENTAGE
    );

    return {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'DWZ Rating',
                data: dwzData,
                borderColor: CHART_CONFIG.LINE_COLOR,
                backgroundColor: CHART_CONFIG.LINE_BACKGROUND_COLOR,
                borderWidth: 3,
                pointRadius: CHART_CONFIG.POINT_RADIUS,
                pointHoverRadius: CHART_CONFIG.POINT_HOVER_RADIUS,
                pointBackgroundColor: CHART_CONFIG.LINE_COLOR,
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                tension: 0.1
            }]
        },
        options: {
            responsive: false,
            plugins: {
                title: {
                    display: true,
                    text: `DWZ Progression - ${playerName}`,
                    font: {
                        size: 18,
                        weight: 'bold'
                    },
                    padding: 20
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    min: Math.max(0, minDWZ - padding),
                    max: maxDWZ + padding,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        font: {
                            size: 12
                        }
                    },
                    title: {
                        display: true,
                        text: 'DWZ Rating',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 0,
                        font: {
                            size: 10
                        }
                    },
                    title: {
                        display: true,
                        text: 'Tournaments',
                        font: {
                            size: 14,
                            weight: 'bold'
                        }
                    }
                }
            },
            layout: {
                padding: 20
            }
        }
    };
}

/**
 * Generate chart image and create Discord attachment
 * @private
 * @param {Object} configuration - Chart.js configuration
 * @returns {Promise<AttachmentBuilder>} Discord attachment
 */
async function _generateAndSaveChart(configuration) {
    // Generate the chart image
    const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
    
    // Create a temporary file name
    const fileName = `dwz_chart_${Date.now()}.png`;
    const filePath = path.join(process.cwd(), 'temp', fileName);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Save the image
    fs.writeFileSync(filePath, imageBuffer);
    
    // Create Discord attachment
    const attachment = new AttachmentBuilder(filePath, { name: fileName });
    
    // Add filePath for testing/cleanup purposes
    attachment.filePath = filePath;
    
    // Clean up the file after a delay
    _scheduleFileCleanup(filePath);
    
    return attachment;
}

/**
 * Schedule file cleanup after delay
 * @private
 * @param {string} filePath - Path to file to clean up
 */
function _scheduleFileCleanup(filePath) {
    setTimeout(() => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                logger.debug(`Cleaned up chart file: ${filePath}`);
            }
        } catch (error) {
            logger.warn('Failed to clean up chart file', { filePath, error: error.message });
        }
    }, CHART_CONFIG.CLEANUP_DELAY_MS);
}

/**
 * Generate summary statistics from tournament data
 * @param {Array} tournaments - Array of tournament objects
 * @returns {Object|null} - Statistics object or null if insufficient data
 */
function generateDWZStatistics(tournaments) {
    if (!Array.isArray(tournaments) || tournaments.length === 0) {
        logger.warn('No tournament data provided for statistics generation');
        return null;
    }

    const validTournaments = tournaments
        .filter(tournament => _isValidTournamentForStats(tournament))
        .sort((a, b) => a.index - b.index);
    
    if (validTournaments.length === 0) {
        logger.warn('No valid tournaments found for statistics generation');
        return null;
    }
    
    const startingDWZ = parseInt(validTournaments[0].dwzalt);
    const currentDWZ = parseInt(validTournaments[validTournaments.length - 1].dwzneu);
    const totalChange = currentDWZ - startingDWZ;
    
    const performanceStats = _calculatePerformanceStats(validTournaments);
    const gameStats = _calculateGameStats(validTournaments);
    
    return {
        startingDWZ,
        currentDWZ,
        totalChange,
        bestGain: performanceStats.bestGain,
        worstLoss: performanceStats.worstLoss,
        tournamentCount: validTournaments.length,
        totalGames: gameStats.totalGames,
        totalPoints: gameStats.totalPoints,
        averageScore: gameStats.averageScore
    };
}

/**
 * Check if tournament is valid for statistics calculation
 * @private
 * @param {Object} tournament - Tournament object
 * @returns {boolean} Whether tournament is valid
 */
function _isValidTournamentForStats(tournament) {
    return tournament && 
           tournament.dwzalt && 
           tournament.dwzneu && 
           tournament.dwzalt !== '0' && 
           tournament.dwzneu !== '0' &&
           !isNaN(parseInt(tournament.dwzalt)) &&
           !isNaN(parseInt(tournament.dwzneu));
}

/**
 * Calculate performance statistics (best gain, worst loss)
 * @private
 * @param {Array} validTournaments - Valid tournament data
 * @returns {Object} Performance statistics
 */
function _calculatePerformanceStats(validTournaments) {
    let bestGain = -Infinity;
    let worstLoss = Infinity;
    
    validTournaments.forEach(tournament => {
        const change = parseInt(tournament.dwzneu) - parseInt(tournament.dwzalt);
        if (change > bestGain) bestGain = change;
        if (change < worstLoss) worstLoss = change;
    });
    
    return {
        bestGain: bestGain === -Infinity ? 0 : bestGain,
        worstLoss: worstLoss === Infinity ? 0 : worstLoss
    };
}

/**
 * Calculate game statistics (total games, points, average score)
 * @private
 * @param {Array} validTournaments - Valid tournament data
 * @returns {Object} Game statistics
 */
function _calculateGameStats(validTournaments) {
    let totalGames = 0;
    let totalPoints = 0;
    
    validTournaments.forEach(tournament => {
        if (tournament.partien && tournament.punkte) {
            totalGames += parseInt(tournament.partien) || 0;
            totalPoints += parseFloat(tournament.punkte) || 0;
        }
    });
    
    const averageScore = totalGames > 0 ? (totalPoints / totalGames * 100).toFixed(1) : 0;
    
    return {
        totalGames,
        totalPoints,
        averageScore
    };
}

module.exports = {
    generateDWZChart,
    generateDWZStatistics
};
