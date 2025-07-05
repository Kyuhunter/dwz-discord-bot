const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../utils/config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dwz')
        .setDescription('Suche nach der DWZ-Wertung eines Schachspielers vom Deutschen Schachbund')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Spielername zum Suchen (z.B. "Müller", "Schmidt, Hans" oder "Schmidt München")')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        const playerName = interaction.options.getString('name');
        
        await interaction.deferReply();
        
        try {
            const searchResults = await searchDWZPlayer(playerName);
            
            if (searchResults.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(config.getColor('error'))
                    .setTitle(config.t('search.title'))
                    .setDescription(config.t('search.no_players_found', { query: playerName }))
                    .addFields({
                        name: config.t('search.tips.title'),
                        value: config.t('search.tips.content')
                    })
                    .addFields({
                        name: config.t('search.direct_search.title'),
                        value: `[${config.t('search.direct_search.link_text')}](${config.get('external.schachbund.base_url')}${config.get('external.schachbund.player_search_endpoint')}?search=${encodeURIComponent(playerName)})`
                    });

                if (config.get('display.embed.show_footer')) {
                    embed.setFooter({
                        text: config.t('data_source'),
                        iconURL: config.get('display.embed.footer_icon')
                    });
                }
                
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
                const maxResults = config.get('bot.max_search_results', 10);
                const embed = new EmbedBuilder()
                    .setColor(config.getColor('info'))
                    .setTitle('🔍 Mehrere Spieler gefunden')
                    .setDescription(`Gefunden: **${searchResults.length}** Spieler für "${playerName}"`);

                // Show up to configured number of results
                const resultsToShow = searchResults.slice(0, maxResults);
                
                // Check if there are any players with duplicate names
                const hasDuplicateNames = resultsToShow.some(player => player.hasNameDuplicate);
                if (hasDuplicateNames) {
                    embed.addFields({
                        name: '💡 Tipp für eindeutige Suche',
                        value: 'Bei mehreren Spielern mit gleichem Namen können Sie mit **Vereinsname** suchen:\n' +
                               '• `/dwz Schmidt München` - Sucht Schmidt in München\n' +
                               '• `/dwz Müller SV` - Sucht Müller in einem SV-Verein\n' +
                               '• `/dwz Wagner Berlin` - Sucht Wagner in Berlin',
                        inline: false
                    });
                }
                
                for (const player of resultsToShow) {
                    const dwzText = player.dwz ? 
                        `🏆 DWZ ${player.dwz}` : 
                        '🏆 Keine DWZ';
                    const clubText = player.club ? 
                        `\n🏛️ ${player.club}` : 
                        '\n🏛️ Verein unbekannt';
                    
                    // Build the display name with disambiguation if needed
                    let displayName = player.name;
                    let valueText = `${dwzText}${clubText}`;
                    
                    // Add disambiguation info for duplicate names
                    if (player.hasNameDuplicate && player.disambiguationInfo) {
                        valueText += `\n\n**Unterscheidung:** ${player.disambiguationInfo}`;
                    }
                    
                    embed.addFields({
                        name: displayName,
                        value: valueText,
                        inline: true
                    });
                }
                
                if (searchResults.length > maxResults) {
                    embed.addFields({
                        name: '📋 Weitere Ergebnisse',
                        value: `Es gibt ${searchResults.length - maxResults} weitere Spieler. Verwenden Sie einen spezifischeren Suchbegriff oder Vereinsnamen.`,
                        inline: false
                    });
                }
                
                // Add footer with data source
                embed.setFooter({
                    text: 'Daten von schachbund.de • Tipp: Verwenden Sie Vereinsnamen für eindeutige Suche',
                    iconURL: 'https://www.schachbund.de/favicon.ico'
                });
                
                await interaction.editReply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('Error searching DWZ:', error);
            
            let errorMessage = 'Sorry, there was an error searching for the player.';
            let errorDetails = error.message || 'Unknown error occurred';
            
            if (error.response?.status === 404) {
                errorMessage = 'Search service temporarily unavailable';
                errorDetails = 'The search endpoint may have changed. Please try again later or search directly on schachbund.de';
            } else if (error.code === 'ENOTFOUND') {
                errorMessage = 'Cannot connect to schachbund.de';
                errorDetails = 'Check your internet connection or try again later';
            } else if (error.code === 'ETIMEDOUT') {
                errorMessage = 'Search request timed out';
                errorDetails = 'The server is responding slowly. Please try again.';
            }
            
            const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle('❌ DWZ Search Error')
                .setDescription(errorMessage)
                .addFields({
                    name: 'Error Details',
                    value: errorDetails
                })
                .addFields({
                    name: '🔗 Alternative',
                    value: `[Search directly on schachbund.de](https://www.schachbund.de/spieler.html?search=${encodeURIComponent(playerName)})`
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
        // Check if the search includes club information for disambiguation
        let searchTerm = playerName;
        let clubFilter = null;
        
        // Enhanced club detection patterns
        const clubKeywords = ['SV', 'SC', 'SK', 'TSV', 'FC', 'TuS', 'Verein', 'Schach', 'Club', 'Klub', 'Chess'];
        const cityPatterns = /\b([A-ZÄÖÜ][a-zäöüß]{3,}(?:-[A-ZÄÖÜ][a-zäöüß]+)*)\b/; // Cities like "München", "Bad-Neustadt"
        const words = playerName.trim().split(/\s+/);
        
        if (words.length >= 2) {
            // Check if any word after the first looks like a club identifier
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const remainingWords = words.slice(i);
                
                // Check for exact club keyword matches
                const isClubKeyword = clubKeywords.some(keyword => 
                    word.toLowerCase() === keyword.toLowerCase() ||
                    word.toLowerCase().includes(keyword.toLowerCase()) || 
                    keyword.toLowerCase().includes(word.toLowerCase())
                );
                
                // Check for city/place names (capitalized, longer than 3 chars)
                const looksLikePlace = cityPatterns.test(word);
                
                // Check for common club abbreviations or patterns
                const isClubPattern = /^(SG|TSG|PSV|BSV|ESV|ASV|LSV|VSK|VfL|SpVgg|Sp\.?Vgg)$/i.test(word);
                
                // Check for multi-word club names like "SC München" or "Schach Berlin"
                const hasClubContext = remainingWords.some(w => 
                    clubKeywords.some(keyword => w.toLowerCase().includes(keyword.toLowerCase()))
                );
                
                if (isClubKeyword || looksLikePlace || isClubPattern || hasClubContext) {
                    // Split the search: first part is player name, rest is club filter
                    searchTerm = words.slice(0, i).join(' ');
                    clubFilter = words.slice(i).join(' ');
                    console.log(`Detected club-based search: player="${searchTerm}", club filter="${clubFilter}"`);
                    break;
                }
            }
        }
        
        // Alternative detection: look for patterns like "Name (Club)" or "Name - Club"
        const parenthesesMatch = playerName.match(/^(.+?)\s*[\(\-]\s*(.+?)[\)\s]*$/);
        if (!clubFilter && parenthesesMatch) {
            const potentialName = parenthesesMatch[1].trim();
            const potentialClub = parenthesesMatch[2].trim();
            
            // If the second part looks like a club (contains keywords or is capitalized)
            if (potentialClub.length > 2 && 
                (clubKeywords.some(kw => potentialClub.toLowerCase().includes(kw.toLowerCase())) ||
                 cityPatterns.test(potentialClub))) {
                searchTerm = potentialName;
                clubFilter = potentialClub;
                console.log(`Detected parentheses/dash club search: player="${searchTerm}", club filter="${clubFilter}"`);
            }
        }
        
        // Use the correct search endpoint from schachbund.de
        const searchUrl = `https://www.schachbund.de/spieler.html?search=${encodeURIComponent(searchTerm)}`;
        
        console.log(`Searching for: ${searchTerm} at ${searchUrl}`);
        if (clubFilter) {
            console.log(`Will filter results by club containing: ${clubFilter}`);
        }
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Referer': 'https://www.schachbund.de/spieler.html'
            },
            timeout: 15000
        });
        
        console.log(`Response status: ${response.status}, content length: ${response.data.length}`);
        
        const $ = cheerio.load(response.data);
        const players = [];
        
        // Look for the specific search results structure used by schachbund.de
        // Results are in a div with class "searchresult" containing a table with class "body"
        const searchResultDiv = $('.searchresult');
        
        if (searchResultDiv.length > 0) {
            console.log('Found searchresult div');
            
            // Look for the body table within searchresult
            const bodyTable = searchResultDiv.find('table.body');
            
            if (bodyTable.length > 0) {
                console.log('Found body table');
                
                // Parse the tbody rows (skip thead)
                const tbody = bodyTable.find('tbody');
                const rows = tbody.find('tr');
                
                console.log(`Found ${rows.length} result rows`);
                
                rows.each((index, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 5) {
                        // Expected structure: Spielername | Letzte Ausw. | DWZ | Elo | Verein
                        const nameCell = $(cells[0]);
                        const lastEvalCell = $(cells[1]);
                        const dwzCell = $(cells[2]);
                        const eloCell = $(cells[3]);
                        const clubCell = $(cells[4]);
                        
                        const name = nameCell.text().trim();
                        const dwzText = dwzCell.text().trim();
                        const clubText = clubCell.text().trim();
                        const lastEval = lastEvalCell.text().trim();
                        
                        // Try to extract player link/ID for unique identification
                        let playerId = null;
                        let playerLink = null;
                        const nameLink = nameCell.find('a');
                        if (nameLink.length > 0) {
                            playerLink = nameLink.attr('href');
                            // Extract player ID from link (e.g., spieler.php?pkz=123456)
                            const idMatch = playerLink ? playerLink.match(/pkz=(\d+)/) : null;
                            if (idMatch) {
                                playerId = idMatch[1];
                            }
                        }
                        
                        // Extract birth year from name if present (format: "Name (1995)")
                        let birthYear = null;
                        const yearMatch = name.match(/\((\d{4})\)/);
                        if (yearMatch) {
                            birthYear = yearMatch[1];
                        }
                        
                        // Extract DWZ number (format might be "1253 - 39" where 1253 is the rating)
                        let dwz = null;
                        if (dwzText && dwzText !== '-----' && dwzText !== '') {
                            const dwzMatch = dwzText.match(/(\d+)/);
                            if (dwzMatch) {
                                dwz = dwzMatch[1];
                            }
                        }
                        
                        // Clean up club name (remove link if it's there)
                        let club = null;
                        if (clubText && clubText !== '') {
                            const clubLink = clubCell.find('a');
                            club = clubLink.length > 0 ? clubLink.text().trim() : clubText;
                        }
                        
                        if (name && name.length > 2) {
                            const player = {
                                name: name,
                                dwz: dwz,
                                club: club,
                                pkz: playerId, // Now extracted from search results
                                link: playerLink,
                                zpk: null, // Will be fetched later if club is available
                                birthYear: birthYear,
                                lastEvaluation: lastEval
                            };
                            
                            players.push(player);
                            console.log(`Added player: ${JSON.stringify(player)}`);
                        }
                    }
                });
            }
        }
        
        // If no results found with primary method, try fallback
        if (players.length === 0) {
            console.log('No results with primary method, trying fallback');
            return await parseAlternativeFormat($, playerName);
        }
        
        // Remove duplicates based on player ID (pkz) if available, otherwise name and DWZ
        const uniquePlayers = players.filter((player, index, self) => {
            if (player.pkz) {
                // Use player ID for exact identification
                return index === self.findIndex((p) => p.pkz === player.pkz);
            } else {
                // Fallback to name, DWZ, and club for identification
                return index === self.findIndex((p) => 
                    p.name === player.name && 
                    p.dwz === player.dwz && 
                    p.club === player.club
                );
            }
        });
        
        console.log(`Found ${uniquePlayers.length} unique players`);
        
        // Apply club filter if specified
        let filteredPlayers = uniquePlayers;
        if (clubFilter) {
            filteredPlayers = uniquePlayers.filter(player => {
                if (!player.club) return false;
                
                const clubLower = player.club.toLowerCase();
                const filterLower = clubFilter.toLowerCase();
                
                // Direct substring match
                if (clubLower.includes(filterLower) || filterLower.includes(clubLower)) {
                    return true;
                }
                
                // Word-based matching for better partial matches
                const clubWords = clubLower.split(/\s+/);
                const filterWords = filterLower.split(/\s+/);
                
                // Check if any filter word matches any club word
                const hasWordMatch = filterWords.some(filterWord => 
                    clubWords.some(clubWord => 
                        clubWord.includes(filterWord) || filterWord.includes(clubWord)
                    )
                );
                
                // Check for abbreviation matches (e.g., "SC" matches "Schachclub")
                const hasAbbrevMatch = filterWords.some(filterWord => {
                    if (filterWord.length <= 3) {
                        return clubWords.some(clubWord => 
                            clubWord.startsWith(filterWord) || 
                            clubWord === filterWord
                        );
                    }
                    return false;
                });
                
                return hasWordMatch || hasAbbrevMatch;
            });
            
            console.log(`After club filter "${clubFilter}": ${filteredPlayers.length} players remain`);
            
            // If club filter eliminates all results, fall back to original results
            if (filteredPlayers.length === 0) {
                console.log('Club filter eliminated all results, falling back to full list');
                filteredPlayers = uniquePlayers;
            }
        }
        
        // Check for players with identical names but different identifiers
        const nameGroups = filteredPlayers.reduce((groups, player) => {
            const cleanName = player.name.replace(/\s*\(\d{4}\)\s*/, '').trim(); // Remove birth year from name
            if (!groups[cleanName]) {
                groups[cleanName] = [];
            }
            groups[cleanName].push(player);
            return groups;
        }, {});
        
        // Add disambiguation info for players with identical names
        Object.values(nameGroups).forEach(group => {
            if (group.length > 1) {
                console.log(`Found ${group.length} players with identical name: ${group[0].name}`);
                
                // Sort players by club name for consistent display order
                group.sort((a, b) => {
                    const clubA = a.club || 'zzz_no_club';
                    const clubB = b.club || 'zzz_no_club';
                    return clubA.localeCompare(clubB);
                });
                
                group.forEach(player => {
                    player.hasNameDuplicate = true;
                    const disambiguationParts = [];
                    
                    // Primary: Use club name as main differentiator
                    if (player.club && player.club !== 'Search on website for details') {
                        // Shorten very long club names for display
                        let clubName = player.club;
                        if (clubName.length > 40) {
                            clubName = clubName.substring(0, 37) + '...';
                        }
                        disambiguationParts.push(`🏛️ ${clubName}`);
                    } else {
                        disambiguationParts.push('🏛️ Club unknown');
                    }
                    
                    // Secondary: Add birth year if available
                    if (player.birthYear) {
                        disambiguationParts.push(`📅 Born ${player.birthYear}`);
                    }
                    
                    // Tertiary: Add DWZ if clubs are the same or for additional context
                    if (player.dwz && player.dwz !== '0' && player.dwz !== '') {
                        // Check if other players in group have same club
                        const sameClubPlayers = group.filter(p => p.club === player.club);
                        if (sameClubPlayers.length > 1 || !player.club || player.club === 'Search on website for details') {
                            disambiguationParts.push(`🏆 DWZ ${player.dwz}`);
                        }
                    }
                    
                    // Quaternary: Add player ID if still ambiguous
                    if (player.pkz && (disambiguationParts.length <= 1 || 
                        group.filter(p => p.club === player.club && p.birthYear === player.birthYear).length > 1)) {
                        disambiguationParts.push(`🆔 ID ${player.pkz}`);
                    }
                    
                    player.disambiguationInfo = disambiguationParts.join(' • ');
                });
            }
        });
        
        // Only fetch detailed data for single results (to minimize API requests)
        const shouldFetchDetails = config.get('bot.detailed_data_single_only', true) ? 
                                  filteredPlayers.length === 1 : true;
        
        if (shouldFetchDetails) {
            // Enhance players with ZPK data and detailed information if club information is available
            for (const player of filteredPlayers) {
                if (player.club && player.club !== 'Search on website for details') {
                    try {
                        console.log(`Fetching ZPK for player ${player.name} in club ${player.club}`);
                        const zpk = await getPlayerZPK(player.name, player.club);
                        if (zpk) {
                            player.zpk = zpk;
                            console.log(`Found ZPK ${zpk} for ${player.name}`);
                            
                            // Fetch detailed player information using ZPK
                            console.log(`Fetching detailed player data for ${player.name}`);
                            const playerDetails = await getPlayerDetails(zpk);
                            if (playerDetails) {
                                player.details = playerDetails;
                                console.log(`Enhanced ${player.name} with detailed data`);
                            }
                        }
                    } catch (error) {
                        console.log(`Could not fetch ZPK for ${player.name}: ${error.message}`);
                    }
                }
            }
        } else {
            console.log(`Skipping detailed data fetch for ${filteredPlayers.length} players (multiple results mode)`);
        }
        
        return filteredPlayers;
        
    } catch (error) {
        console.error('DWZ Search Error:', error.message);
        
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            throw new Error('Unable to connect to schachbund.de. The service might be temporarily unavailable.');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('Search request timed out. Please try again.');
        } else if (error.response?.status === 404) {
            throw new Error('Search endpoint not found. The website structure may have changed.');
        } else if (error.response?.status >= 500) {
            throw new Error('Server error on schachbund.de. Please try again later.');
        } else {
            throw new Error(`Search failed: ${error.message}`);
        }
    }
}

async function parseAlternativeFormat($, playerName) {
    const players = [];
    
    console.log('Trying alternative parsing methods');
    
    // Method 1: Look for any table with player-like data
    $('table').each((tableIndex, table) => {
        const $table = $(table);
        const rows = $table.find('tr');
        
        // Skip very small tables (likely not player data)
        if (rows.length < 2) return;
        
        rows.each((rowIndex, row) => {
            const $row = $(row);
            const cells = $row.find('td');
            
            // Look for rows that might contain player data
            if (cells.length >= 3) {
                const firstCellText = $(cells[0]).text().trim();
                const secondCellText = $(cells[1]).text().trim();
                
                // Check if first cell contains a name-like string
                if (firstCellText.length > 3 && 
                    firstCellText.toLowerCase().includes(playerName.toLowerCase()) &&
                    !firstCellText.includes('Gefundene') &&
                    !firstCellText.includes('Zugriffe') &&
                    !firstCellText.includes('Zeit')) {
                    
                    // Extract DWZ from any cell that contains numbers
                    let dwz = null;
                    for (let i = 1; i < cells.length; i++) {
                        const cellText = $(cells[i]).text().trim();
                        const dwzMatch = cellText.match(/(\d{3,4})/); // DWZ is typically 3-4 digits
                        if (dwzMatch && parseInt(dwzMatch[1]) > 500 && parseInt(dwzMatch[1]) < 3000) {
                            dwz = dwzMatch[1];
                            break;
                        }
                    }
                    
                    // Look for club in the last cell or cells with links
                    let club = null;
                    let playerId = null;
                    let playerLink = null;
                    let birthYear = null;
                    
                    // Extract birth year from name if present
                    const yearMatch = firstCellText.match(/\((\d{4})\)/);
                    if (yearMatch) {
                        birthYear = yearMatch[1];
                    }
                    
                    for (let i = cells.length - 1; i >= 0; i--) {
                        const $cell = $(cells[i]);
                        const cellText = $cell.text().trim();
                        const cellLink = $cell.find('a');
                        
                        // Try to extract player ID from any links
                        if (cellLink.length > 0) {
                            const href = cellLink.attr('href');
                            if (href) {
                                const idMatch = href.match(/pkz=(\d+)/);
                                if (idMatch) {
                                    playerId = idMatch[1];
                                    playerLink = href;
                                }
                                
                                if (href.includes('verein')) {
                                    club = cellLink.text().trim();
                                }
                            }
                        } else if (cellText.length > 5 && 
                                   !cellText.match(/^\d+$/) && 
                                   !cellText.includes('-----')) {
                            club = cellText;
                        }
                    }
                    
                    players.push({
                        name: firstCellText,
                        dwz: dwz,
                        club: club,
                        pkz: playerId,
                        link: playerLink,
                        zpk: null,
                        birthYear: birthYear,
                        lastEvaluation: null
                    });
                    
                    console.log(`Alternative method found: ${firstCellText}, DWZ: ${dwz}, Club: ${club}`);
                }
            }
        });
    });
    
    // Method 2: Look for text patterns that match the search
    if (players.length === 0) {
        const bodyText = $('body').text();
        if (bodyText.toLowerCase().includes(playerName.toLowerCase())) {
            console.log('Player name found in page text, but no structured data found');
            
            // Provide at least a link to manual search
            players.push({
                name: `Found reference to "${playerName}"`,
                dwz: null,
                club: 'Check manual search for details',
                pkz: null,
                link: `https://www.schachbund.de/spieler.html?search=${encodeURIComponent(playerName)}`,
                zpk: null
            });
        }
    }
    
    return players;
}

async function createPlayerEmbed(player) {
    const embed = new EmbedBuilder()
        .setColor(config.getColor('success'))
        .setTitle(config.t('player.title'))
        .setDescription(`**${player.name}**`);
    
    // Use detailed data if available, otherwise fall back to basic data
    const details = player.details || {};
    
    // Add DWZ rating (prefer detailed data)
    const dwzRating = details.dwz || player.dwz;
    const dwzIndex = details.dwzindex || player.index;
    
    if (dwzRating && dwzRating !== '0' && dwzRating !== '') {
        let dwzText = dwzRating;
        if (dwzIndex && dwzIndex !== '0' && dwzIndex !== '') {
            dwzText += ` (Index: ${dwzIndex})`;
        }
        embed.addFields({
            name: '🏆 DWZ Rating',
            value: dwzText,
            inline: true
        });
    } else {
        embed.addFields({
            name: '🏆 DWZ Rating',
            value: 'No rating available',
            inline: true
        });
    }
    
    // Add FIDE information if available
    const fideElo = details.fideelo;
    const fideId = details.fideid;
    const fideTitle = details.fidetitel;
    const fideNation = details.fidenation;
    
    if (fideId && fideId !== '0' && fideId !== '') {
        let fideText = '';
        if (fideTitle && fideTitle !== '') {
            fideText += `${fideTitle} `;
        }
        if (fideElo && fideElo !== '0' && fideElo !== '') {
            fideText += fideElo;
        } else {
            fideText += 'Unrated';
        }
        if (fideNation && fideNation !== '') {
            fideText += ` (${fideNation})`;
        }
        fideText += `\nID: ${fideId}`;
        
        embed.addFields({
            name: '🌍 FIDE Rating',
            value: fideText,
            inline: true
        });
    }
    
    // Add member number and status if available
    const memberNumber = details.member_zpsmgl;
    const status = details.member_status;
    
    if (memberNumber && memberNumber !== '0' && memberNumber !== '') {
        let memberText = `#${memberNumber}`;
        if (status && status !== '') {
            // Status codes: P = Passive, etc.
            const statusMap = {
                'P': 'Passive',
                'A': 'Active',
                'E': 'Ehrenmitglied',
                'J': 'Jugend'
            };
            const statusDescription = statusMap[status] || status;
            memberText += ` (${statusDescription})`;
        } else {
            memberText += ' (Active)';
        }
        embed.addFields({
            name: '� Member Number',
            value: memberText,
            inline: true
        });
    }
    
    // Add tournament information if available
    if (details.tournaments && details.tournaments.length > 0) {
        const tournaments = details.tournaments;
        
        // Create tournament history text
        let tournamentText = '';
        tournaments.forEach((tournament, index) => {
            const name = tournament.turniername || 'Unknown Tournament';
            const code = tournament.turniercode || '';
            const score = tournament.punkte || '0';
            const games = tournament.partien || '0';
            const oldDwz = tournament.dwzalt || '0';
            const newDwz = tournament.dwzneu || '0';
            const performance = tournament.leistung || '0';
            
            // Calculate DWZ change
            let dwzChange = '';
            if (oldDwz && newDwz && oldDwz !== '0' && newDwz !== '0') {
                const change = parseInt(newDwz) - parseInt(oldDwz);
                if (change > 0) {
                    dwzChange = ` (+${change})`;
                } else if (change < 0) {
                    dwzChange = ` (${change})`;
                } else {
                    dwzChange = ' (0)';
                }
            }
            
            tournamentText += `**${index + 1}. ${name}**\n`;
            if (code) tournamentText += `Code: ${code}\n`;
            tournamentText += `Score: ${score}/${games}`;
            if (performance && performance !== '0') {
                tournamentText += ` • Performance: ${performance}`;
            }
            if (dwzChange) {
                tournamentText += ` • DWZ: ${oldDwz}→${newDwz}${dwzChange}`;
            }
            
            if (index < tournaments.length - 1) {
                tournamentText += '\n\n';
            }
        });
        
        embed.addFields({
            name: `🏁 Recent Tournaments (Last ${tournaments.length})`,
            value: tournamentText || 'No tournament data available',
            inline: false
        });
    }
    
    // Add club information (prefer detailed data)
    const clubName = details.member_vereinsname || player.club;
    if (clubName) {
        embed.addFields({
            name: '🏛️ Club',
            value: clubName,
            inline: false
        });
    }
    
    // Add ZPK (internal player ID) if available
    if (player.zpk) {
        embed.addFields({
            name: '🆔 Player ID (ZPK)',
            value: player.zpk,
            inline: true
        });
    }
    
    // Add title if available
    const title = details.titel;
    if (title && title !== '') {
        embed.addFields({
            name: '🎖️ Title',
            value: title,
            inline: true
        });
    }
    
    // Add nationality if different from club
    if (fideNation && fideNation !== '' && fideNation !== 'GER') {
        embed.addFields({
            name: '🌍 Nationality',
            value: fideNation,
            inline: true
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
    
    // Add footer if enabled
    if (config.get('display.embed.show_footer')) {
        embed.setFooter({
            text: config.t('data_source'),
            iconURL: config.get('display.embed.footer_icon')
        });
    }

    return embed;
}

function extractPKZFromLink(link) {
    const match = link.match(/pkz=(\d+)/);
    return match ? match[1] : null;
}

async function getClubZPS(clubName) {
    try {
        // Clean club name - only keep letters, spaces, and numbers
        const cleanClubName = clubName.replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '').trim();
        console.log(`Cleaned club name from "${clubName}" to "${cleanClubName}"`);
        
        const searchUrl = `https://www.schachbund.de/verein.html?search=${encodeURIComponent(cleanClubName)}`;
        console.log(`Searching for club ZPS: ${cleanClubName} at ${searchUrl}`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Referer': 'https://www.schachbund.de/verein.html'
            },
            timeout: 10000,
            maxRedirects: 5 // Allow redirects
        });
        
        // Check if we were redirected to a specific club page
        const finalUrl = response.request.res.responseUrl || response.config.url;
        console.log(`Final URL after redirects: ${finalUrl}`);
        
        // Check if the final URL contains the ZPS pattern
        const urlZpsMatch = finalUrl.match(/\/verein\/(\d+)\.html/);
        if (urlZpsMatch) {
            console.log(`Found ZPS ${urlZpsMatch[1]} from redirect URL: ${finalUrl}`);
            return urlZpsMatch[1];
        }
        
        const $ = cheerio.load(response.data);
        
        // Look for any link that contains /verein/NUMBER.html pattern
        const links = $('a[href*="/verein/"]');
        console.log(`Found ${links.length} links with /verein/ pattern`);
        
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const href = $(link).attr('href');
            // Match pattern like /verein/65129.html or https://www.schachbund.de/verein/65129.html
            const zpsMatch = href.match(/\/verein\/(\d+)\.html/);
            if (zpsMatch) {
                const linkText = $(link).text().trim();
                console.log(`Checking link: "${linkText}" with ZPS ${zpsMatch[1]} from URL ${href}`);
                
                // Check if the link text matches our cleaned club name
                const cleanLinkText = linkText.replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '').trim();
                if (cleanLinkText.toLowerCase().includes(cleanClubName.toLowerCase()) ||
                    cleanClubName.toLowerCase().includes(cleanLinkText.toLowerCase())) {
                    console.log(`Found ZPS ${zpsMatch[1]} for club ${linkText} via URL pattern`);
                    return zpsMatch[1];
                }
            }
        }
        
        // Fallback: Look for club search results in table structure
        const searchResultDiv = $('.searchresult');
        
        if (searchResultDiv.length > 0) {
            console.log('Found searchresult div, checking table structure');
            const bodyTable = searchResultDiv.find('table.body');
            
            if (bodyTable.length > 0) {
                const tbody = bodyTable.find('tbody');
                const rows = tbody.find('tr');
                console.log(`Found ${rows.length} club result rows`);
                
                // Find the first matching club
                for (let i = 0; i < rows.length; i++) {
                    const $row = $(rows[i]);
                    const cells = $row.find('td');
                    
                    if (cells.length >= 1) {
                        // Look for ZPS in any cell or link within the row
                        cells.each((cellIndex, cell) => {
                            const $cell = $(cell);
                            const cellText = $cell.text().trim();
                            
                            // Check if cell contains club name
                            const cleanCellText = cellText.replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '').trim();
                            if (cleanCellText.toLowerCase().includes(cleanClubName.toLowerCase()) ||
                                cleanClubName.toLowerCase().includes(cleanCellText.toLowerCase())) {
                                
                                // Look for ZPS in links within this cell using the URL pattern
                                const cellLinks = $cell.find('a[href*="/verein/"]');
                                cellLinks.each((linkIndex, cellLink) => {
                                    const cellHref = $(cellLink).attr('href');
                                    const cellZpsMatch = cellHref.match(/\/verein\/(\d+)\.html/);
                                    if (cellZpsMatch) {
                                        console.log(`Found ZPS ${cellZpsMatch[1]} for club ${cellText} in table cell`);
                                        return cellZpsMatch[1];
                                    }
                                });
                            }
                        });
                    }
                }
            }
        }
        
        console.log(`No ZPS found for club: ${cleanClubName}`);
        return null;
        
    } catch (error) {
        console.error(`Error fetching ZPS for club ${clubName}:`, error.message);
        return null;
    }
}

async function getPlayerZPK(playerName, clubName) {
    try {
        // First get the club's ZPS
        const zps = await getClubZPS(clubName);
        if (!zps) {
            console.log(`Could not find ZPS for club: ${clubName}`);
            return null;
        }
        
        // Parse the player name - handle comma-separated format
        let searchLastname = '';
        let searchFirstname = '';
        
        if (playerName.includes(',')) {
            // Format: "Lastname, Firstname"
            const parts = playerName.split(',').map(part => part.trim());
            searchLastname = parts[0] || '';
            searchFirstname = parts[1] || '';
        } else {
            // Format: "Firstname Lastname" or just "Lastname"
            const nameParts = playerName.trim().split(/\s+/);
            if (nameParts.length >= 2) {
                searchFirstname = nameParts.slice(0, -1).join(' '); // All but last word
                searchLastname = nameParts[nameParts.length - 1]; // Last word
            } else {
                searchLastname = nameParts[0] || '';
            }
        }
        
        console.log(`Searching for player: lastname="${searchLastname}", firstname="${searchFirstname}"`);
        
        // Now fetch the club's XML data
        const xmlUrl = `http://www.schachbund.de/php/dewis/verein.php?zps=${zps}&format=xml`;
        console.log(`Fetching club XML data from: ${xmlUrl}`);
        
        const response = await axios.get(xmlUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/xml,text/xml,*/*'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data, { xmlMode: true });
        
        // Look for player in the XML data
        const spielers = $('Spieler'); // Capital S as shown in the XML
        console.log(`Found ${spielers.length} players in club XML data`);
        
        for (let i = 0; i < spielers.length; i++) {
            const spieler = spielers[i];
            const $spieler = $(spieler);
            
            // Extract player data from XML (using the actual structure)
            const xmlLastname = $spieler.find('nachname').text().trim();
            const xmlFirstname = $spieler.find('vorname').text().trim();
            const zpk = $spieler.find('id').text().trim(); // The ID is the ZPK
            const dwz = $spieler.find('dwz').text().trim();
            
            // Construct full name for display
            const xmlPlayerName = xmlFirstname ? `${xmlFirstname} ${xmlLastname}` : xmlLastname;
            
            console.log(`XML Player: "${xmlPlayerName}" (lastname: "${xmlLastname}", firstname: "${xmlFirstname}", ZPK: ${zpk}, DWZ: ${dwz})`);
            
            // Try different matching strategies
            let isMatch = false;
            
            // Strategy 1: Match by lastname and firstname separately
            if (xmlLastname && xmlFirstname && searchLastname && searchFirstname) {
                const lastnameMatch = xmlLastname.toLowerCase().includes(searchLastname.toLowerCase()) ||
                                    searchLastname.toLowerCase().includes(xmlLastname.toLowerCase());
                const firstnameMatch = xmlFirstname.toLowerCase().includes(searchFirstname.toLowerCase()) ||
                                     searchFirstname.toLowerCase().includes(xmlFirstname.toLowerCase());
                
                if (lastnameMatch && firstnameMatch) {
                    console.log(`✅ Match found by separate name parts: ${xmlLastname}, ${xmlFirstname}`);
                    isMatch = true;
                }
            }
            
            // Strategy 2: Match by full name
            if (!isMatch && xmlPlayerName) {
                const fullNameMatch = xmlPlayerName.toLowerCase().includes(playerName.toLowerCase()) ||
                                    playerName.toLowerCase().includes(xmlPlayerName.toLowerCase());
                
                if (fullNameMatch) {
                    console.log(`✅ Match found by full name: ${xmlPlayerName}`);
                    isMatch = true;
                }
            }
            
            // Strategy 3: Match by lastname only if no firstname provided
            if (!isMatch && searchLastname && !searchFirstname && xmlLastname) {
                const lastnameOnlyMatch = xmlLastname.toLowerCase().includes(searchLastname.toLowerCase()) ||
                                        searchLastname.toLowerCase().includes(xmlLastname.toLowerCase());
                
                if (lastnameOnlyMatch) {
                    console.log(`✅ Match found by lastname only: ${xmlLastname}`);
                    isMatch = true;
                }
            }
            
            if (isMatch && zpk) {
                console.log(`Found matching player: ${xmlPlayerName} with ZPK: ${zpk}`);
                return zpk;
            }
        }
        
        // Alternative XML structure - try different element names
        const players = $('player');
        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            const $player = $(player);
            const xmlPlayerName = $player.find('name').text().trim() || $player.attr('name');
            const zpk = $player.find('id').text().trim() || $player.attr('id') || $player.attr('zpk');
            
            if (xmlPlayerName) {
                const nameMatch = xmlPlayerName.toLowerCase().includes(playerName.toLowerCase()) ||
                                playerName.toLowerCase().includes(xmlPlayerName.toLowerCase());
                
                if (nameMatch && zpk) {
                    console.log(`Found matching player (alt structure): ${xmlPlayerName} with ZPK: ${zpk}`);
                    return zpk;
                }
            }
        }
        
        console.log(`Player ${playerName} not found in club ${clubName} XML data`);
        return null;
        
    } catch (error) {
        console.error(`Error fetching ZPK for player ${playerName}:`, error.message);
        return null;
    }
}

async function getPlayerDetails(zpk) {
    try {
        console.log(`Fetching detailed player data for ZPK: ${zpk}`);
        const detailsUrl = `http://www.schachbund.de/php/dewis/spieler.php?pkz=${zpk}&format=array`;
        
        const response = await axios.get(detailsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
        });
        
        console.log(`Player details response status: ${response.status}, content length: ${response.data.length}`);
        
        // The response is in PHP serialized format
        const playerData = response.data;
        
        if (typeof playerData === 'string') {
            console.log('Player data (first 500 chars):', playerData.substring(0, 500));
            
            // Parse PHP serialized data manually for the "spieler" section
            const details = {};
            
            // Extract spieler data - look for s:7:"spieler";a:XX:{...}
            const spielerMatch = playerData.match(/s:7:"spieler";a:\d+:\{([^}]+)\}/);
            if (spielerMatch) {
                const spielerData = spielerMatch[1];
                console.log('Found spieler data:', spielerData.substring(0, 200));
                
                // Parse individual fields from the spieler data
                // Format: s:2:"id";s:8:"10157565";s:8:"nachname";s:9:"Olschimke";...
                const fieldMatches = spielerData.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/g);
                if (fieldMatches) {
                    for (let i = 0; i < fieldMatches.length; i += 1) {
                        const match = fieldMatches[i];
                        const fieldParts = match.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/);
                        if (fieldParts) {
                            const key = fieldParts[1];
                            const value = fieldParts[2];
                            details[key] = value;
                        }
                    }
                }
            }
            
            // Extract mitgliedschaft data (club membership)
            const mitgliedschaftMatch = playerData.match(/s:14:"mitgliedschaft";a:\d+:\{[^}]*i:0;a:\d+:\{([^}]+)\}/);
            if (mitgliedschaftMatch) {
                const mitgliedschaftData = mitgliedschaftMatch[1];
                const memberFieldMatches = mitgliedschaftData.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/g);
                if (memberFieldMatches) {
                    for (let i = 0; i < memberFieldMatches.length; i += 1) {
                        const match = memberFieldMatches[i];
                        const fieldParts = match.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/);
                        if (fieldParts) {
                            const key = 'member_' + fieldParts[1]; // Prefix to avoid conflicts
                            const value = fieldParts[2];
                            details[key] = value;
                        }
                    }
                }
            }
            
            // Extract tournament data - get all tournaments and find the most recent ones
            const tournamentSectionMatch = playerData.match(/s:7:"turnier";a:(\d+):\{(.*)$/);
            if (tournamentSectionMatch) {
                const tournamentCount = parseInt(tournamentSectionMatch[1]);
                const tournamentSection = tournamentSectionMatch[2];
                
                // Extract all tournaments
                const tournaments = [];
                const tournamentMatches = tournamentSection.match(/i:(\d+);a:\d+:\{([^}]+)\}/g);
                
                if (tournamentMatches) {
                    tournamentMatches.forEach(match => {
                        const tournamentMatch = match.match(/i:(\d+);a:\d+:\{([^}]+)\}/);
                        if (tournamentMatch) {
                            const index = parseInt(tournamentMatch[1]);
                            const tournamentData = tournamentMatch[2];
                            
                            const tournament = {};
                            const fieldMatches = tournamentData.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/g);
                            if (fieldMatches) {
                                fieldMatches.forEach(fieldMatch => {
                                    const fieldParts = fieldMatch.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/);
                                    if (fieldParts) {
                                        tournament[fieldParts[1]] = fieldParts[2];
                                    }
                                });
                                tournament.index = index;
                                tournaments.push(tournament);
                            }
                        }
                    });
                    
                    // Sort tournaments by index (highest index = most recent)
                    tournaments.sort((a, b) => b.index - a.index);
                    
                    // Store the last 3 tournaments
                    details.tournaments = tournaments.slice(0, 3);
                    
                    console.log(`Found ${tournaments.length} tournaments, storing last 3`);
                }
            }
            
            console.log('Parsed player details:', JSON.stringify(details, null, 2));
            return details;
        } else {
            console.log('Player data object:', playerData);
            return playerData;
        }
        
    } catch (error) {
        console.error(`Error fetching player details for ZPK ${zpk}:`, error.message);
        return null;
    }
}
