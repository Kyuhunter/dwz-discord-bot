const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { AttachmentBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Chart configuration
const chartWidth = 800;
const chartHeight = 400;
const chartJSNodeCanvas = new ChartJSNodeCanvas({ 
    width: chartWidth, 
    height: chartHeight,
    backgroundColour: 'white'
});

/**
 * Generate a DWZ progression chart from tournament data
 * @param {Array} tournaments - Array of tournament objects with DWZ data
 * @param {string} playerName - Name of the player for the chart title
 * @returns {Promise<AttachmentBuilder>} - Discord attachment with the chart image
 */
async function generateDWZChart(tournaments, playerName) {
    try {
        // Sort tournaments by index (oldest first for progression)
        const sortedTournaments = tournaments
            .filter(t => t.dwzalt && t.dwzneu && t.dwzalt !== '0' && t.dwzneu !== '0')
            .sort((a, b) => a.index - b.index);
        
        if (sortedTournaments.length < 2) {
            return null; // Not enough data for a meaningful chart
        }
        
        // Prepare data for the chart
        const labels = [];
        const dwzData = [];
        
        // Add starting DWZ from first tournament
        const firstTournament = sortedTournaments[0];
        labels.push('Start');
        dwzData.push(parseInt(firstTournament.dwzalt));
        
        // Add DWZ after each tournament
        sortedTournaments.forEach((tournament, index) => {
            const tournamentName = tournament.turniername || `Tournament ${index + 1}`;
            // Truncate long tournament names
            const shortName = tournamentName.length > 20 
                ? tournamentName.substring(0, 17) + '...' 
                : tournamentName;
            
            labels.push(shortName);
            dwzData.push(parseInt(tournament.dwzneu));
        });
        
        // Calculate min and max for better chart scaling
        const minDWZ = Math.min(...dwzData);
        const maxDWZ = Math.max(...dwzData);
        const padding = Math.max(50, (maxDWZ - minDWZ) * 0.1);
        
        // Create chart configuration
        const configuration = {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'DWZ Rating',
                    data: dwzData,
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderWidth: 3,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: 'rgb(75, 192, 192)',
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
        setTimeout(() => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.log('Failed to clean up chart file:', error.message);
            }
        }, 30000); // Clean up after 30 seconds
        
        return attachment;
        
    } catch (error) {
        console.error('Error generating DWZ chart:', error);
        return null;
    }
}

/**
 * Generate summary statistics from tournament data
 * @param {Array} tournaments - Array of tournament objects
 * @returns {Object} - Statistics object
 */
function generateDWZStatistics(tournaments) {
    const validTournaments = tournaments
        .filter(t => t.dwzalt && t.dwzneu && t.dwzalt !== '0' && t.dwzneu !== '0')
        .sort((a, b) => a.index - b.index);
    
    if (validTournaments.length === 0) {
        return null;
    }
    
    const startingDWZ = parseInt(validTournaments[0].dwzalt);
    const currentDWZ = parseInt(validTournaments[validTournaments.length - 1].dwzneu);
    const totalChange = currentDWZ - startingDWZ;
    
    // Calculate best and worst performance
    let bestGain = -Infinity;
    let worstLoss = Infinity;
    let totalGames = 0;
    let totalPoints = 0;
    
    validTournaments.forEach(tournament => {
        const change = parseInt(tournament.dwzneu) - parseInt(tournament.dwzalt);
        if (change > bestGain) bestGain = change;
        if (change < worstLoss) worstLoss = change;
        
        if (tournament.partien && tournament.punkte) {
            totalGames += parseInt(tournament.partien) || 0;
            totalPoints += parseFloat(tournament.punkte) || 0;
        }
    });
    
    return {
        startingDWZ,
        currentDWZ,
        totalChange,
        bestGain: bestGain === -Infinity ? 0 : bestGain,
        worstLoss: worstLoss === Infinity ? 0 : worstLoss,
        tournamentCount: validTournaments.length,
        totalGames,
        totalPoints,
        averageScore: totalGames > 0 ? (totalPoints / totalGames * 100).toFixed(1) : 0
    };
}

module.exports = {
    generateDWZChart,
    generateDWZStatistics
};
