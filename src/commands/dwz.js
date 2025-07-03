const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dwz')
        .setDescription('Search for a chess player\'s DWZ rating from the German Chess Federation')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Player name to search for (e.g., "Müller" or "Schmidt, Hans")')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const playerName = interaction.options.getString('name');
        
        await interaction.deferReply();
        
        try {
            const searchResults = await searchDWZPlayer(playerName);
            
            if (searchResults.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0xFF0000)
                    .setTitle('🔍 DWZ Search')
                    .setDescription(`No players found for "${playerName}"`)
                    .addFields({
                        name: '💡 Search Tips',
                        value: '• Try using just the last name\n• Check spelling\n• Try variations (e.g., "ä" vs "ae")'
                    })
                    .setFooter({
                        text: 'Data from schachbund.de',
                        iconURL: 'https://www.schachbund.de/favicon.ico'
                    });
                
                await interaction.editReply({ embeds: [embed] });
                return;
            }
            
            if (searchResults.length === 1) {
                // Single result - show detailed information
                const player = searchResults[0];
                const embed = await createPlayerEmbed(player);
                await interaction.editReply({ embeds: [embed] });
            } else {
                // Multiple results - show list
                const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle('🔍 DWZ Search Results')
                    .setDescription(`Found ${searchResults.length} players matching "${playerName}":`)
                    .setFooter({
                        text: 'Data from schachbund.de • Use a more specific name to get detailed info',
                        iconURL: 'https://www.schachbund.de/favicon.ico'
                    });
                
                // Show up to 10 results
                const resultsToShow = searchResults.slice(0, 10);
                for (const player of resultsToShow) {
                    const dwzText = player.dwz ? `DWZ: ${player.dwz}` : 'No DWZ';
                    const clubText = player.club ? ` • ${player.club}` : '';
                    embed.addFields({
                        name: player.name,
                        value: `${dwzText}${clubText}`,
                        inline: true
                    });
                }
                
                if (searchResults.length > 10) {
                    embed.addFields({
                        name: '📋 More Results',
                        value: `... and ${searchResults.length - 10} more players. Use a more specific name to narrow down.`,
                        inline: false
                    });
                }
                
                await interaction.editReply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('Error searching DWZ:', error);
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ DWZ Search Error')
                .setDescription('Sorry, there was an error searching for the player. Please try again later.')
                .addFields({
                    name: 'Error Details',
                    value: error.message || 'Unknown error occurred'
                })
                .setFooter({
                    text: 'Data from schachbund.de',
                    iconURL: 'https://www.schachbund.de/favicon.ico'
                });
            
            await interaction.editReply({ embeds: [embed] });
        }
    },
};

async function searchDWZPlayer(playerName) {
    try {
        // Use the website's search functionality by making a GET request with search parameters
        const searchUrl = `https://www.schachbund.de/spieler/suche.html?nachname=${encodeURIComponent(playerName)}`;
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; DWZ-Discord-Bot/1.0)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        const players = [];
        
        // Look for various possible table structures
        let foundTable = false;
        
        // Try to find the results table - look for tables with player data
        $('table').each((tableIndex, table) => {
            const $table = $(table);
            const rows = $table.find('tr');
            
            if (rows.length > 1) {
                rows.each((rowIndex, row) => {
                    // Skip potential header rows
                    if (rowIndex === 0) return;
                    
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 3) {
                        const nameCell = $(cells[0]);
                        const dwzCell = $(cells[1]);
                        const clubCell = cells.length >= 4 ? $(cells[3]) : $(cells[2]);
                        
                        // Extract name and link
                        const nameLink = nameCell.find('a');
                        const playerName = nameLink.length > 0 ? nameLink.text().trim() : nameCell.text().trim();
                        const playerUrl = nameLink.attr('href');
                        
                        // Extract DWZ
                        const dwzText = dwzCell.text().trim();
                        const dwz = dwzText && dwzText !== '-' && dwzText !== '' ? dwzText : null;
                        
                        // Extract club
                        const club = clubCell.text().trim();
                        
                        // Extract PKZ from URL
                        const pkz = playerUrl ? extractPKZFromLink(playerUrl) : null;
                        
                        if (playerName && playerName.length > 0 && playerName !== 'Name') {
                            const player = {
                                name: playerName,
                                dwz: dwz,
                                club: club && club !== '-' ? club : null,
                                pkz: pkz,
                                link: playerUrl ? (playerUrl.startsWith('http') ? playerUrl : `https://www.schachbund.de${playerUrl}`) : null
                            };
                            
                            players.push(player);
                            foundTable = true;
                        }
                    }
                });
            }
        });
        
        // If no table found, try alternative search approach
        if (!foundTable || players.length === 0) {
            return await alternativeSearch(playerName);
        }
        
        return players;
        
    } catch (error) {
        console.error('DWZ Search Error:', error.message);
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('Unable to connect to schachbund.de. The service might be temporarily unavailable.');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('Search request timed out. Please try again.');
        } else {
            // Try alternative approach
            return await alternativeSearch(playerName);
        }
    }
}

async function alternativeSearch(playerName) {
    try {
        // Alternative approach: simulate a form submission
        const formData = new URLSearchParams();
        formData.append('nachname', playerName);
        formData.append('vorname', '');
        formData.append('vereinsnummer', '');
        formData.append('zps', '');
        formData.append('action', 'suchen');
        
        const response = await axios.post('https://www.schachbund.de/spieler.html', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (compatible; DWZ-Discord-Bot/1.0)',
                'Referer': 'https://www.schachbund.de/spieler.html'
            },
            timeout: 15000
        });
        
        const $ = cheerio.load(response.data);
        const players = [];
        
        // Parse search results
        $('.spieler-liste tr, .search-results tr, table tr').each((index, element) => {
            const $row = $(element);
            const cells = $row.find('td');
            
            if (cells.length >= 3) {
                const nameCell = $(cells[0]);
                const dwzCell = $(cells[1]);
                const clubCell = cells.length >= 4 ? $(cells[3]) : $(cells[2]);
                
                const nameLink = nameCell.find('a');
                const name = nameLink.length > 0 ? nameLink.text().trim() : nameCell.text().trim();
                const dwz = dwzCell.text().trim();
                const club = clubCell.text().trim();
                const url = nameLink.attr('href');
                
                if (name && name !== 'Name' && name.length > 0) {
                    players.push({
                        name: name,
                        dwz: dwz && dwz !== '-' && dwz !== '' ? dwz : null,
                        club: club && club !== '-' ? club : null,
                        pkz: url ? extractPKZFromLink(url) : null,
                        link: url ? (url.startsWith('http') ? url : `https://www.schachbund.de${url}`) : null
                    });
                }
            }
        });
        
        return players;
        
    } catch (error) {
        throw new Error(`Alternative search failed: ${error.message}`);
    }
}

async function createPlayerEmbed(player) {
    const embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('♟️ DWZ Player Information')
        .setDescription(`**${player.name}**`)
        .setFooter({
            text: 'Data from schachbund.de',
            iconURL: 'https://www.schachbund.de/favicon.ico'
        })
        .setTimestamp();
    
    // Add DWZ rating
    if (player.dwz && player.dwz !== '0' && player.dwz !== '') {
        embed.addFields({
            name: '🏆 DWZ Rating',
            value: player.dwz,
            inline: true
        });
    } else {
        embed.addFields({
            name: '🏆 DWZ Rating',
            value: 'No rating available',
            inline: true
        });
    }
    
    // Add index if available
    if (player.index && player.index !== '0' && player.index !== '') {
        embed.addFields({
            name: '📊 Index',
            value: player.index,
            inline: true
        });
    }
    
    // Add club information
    if (player.club) {
        embed.addFields({
            name: '🏛️ Club',
            value: player.club,
            inline: false
        });
    }
    
    // Add rating category interpretation
    if (player.dwz && player.dwz !== '0' && player.dwz !== '') {
        const rating = parseInt(player.dwz);
        let category = '';
        
        if (rating >= 2600) {
            category = '🏅 Super Grandmaster level';
        } else if (rating >= 2500) {
            category = '🥇 Grandmaster level';
        } else if (rating >= 2400) {
            category = '🥈 International Master level';
        } else if (rating >= 2300) {
            category = '🥉 FIDE Master level';
        } else if (rating >= 2200) {
            category = '🟦 Expert level';
        } else if (rating >= 2000) {
            category = '🟩 Advanced player';
        } else if (rating >= 1800) {
            category = '🟨 Strong club player';
        } else if (rating >= 1600) {
            category = '🟧 Club player';
        } else if (rating >= 1400) {
            category = '🟪 Intermediate player';
        } else if (rating >= 1200) {
            category = '⬜ Beginner+';
        } else {
            category = '⬛ Beginner';
        }
        
        embed.addFields({
            name: '📈 Skill Level',
            value: category,
            inline: false
        });
    }
    
    // Add link to full profile if available
    if (player.link) {
        embed.addFields({
            name: '🔗 Full Profile',
            value: `[View on schachbund.de](${player.link})`,
            inline: false
        });
    }
    
    return embed;
}

function extractPKZFromLink(link) {
    const match = link.match(/pkz=(\d+)/);
    return match ? match[1] : null;
}
