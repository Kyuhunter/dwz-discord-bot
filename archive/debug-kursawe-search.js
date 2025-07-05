#!/usr/bin/env node

console.log('🔍 Debugging Player Search Variations for Kursawe');
console.log('=================================================');

// Import the DWZ search functions
const axios = require('axios');
const cheerio = require('cheerio');

async function searchDWZPlayer(playerName, clubFilter = null) {
    try {
        console.log(`🔍 Searching for: "${playerName}"${clubFilter ? ` in club: "${clubFilter}"` : ''}`);
        
        const searchUrl = 'https://www.schachbund.de/spieler.html';
        const response = await axios.get(searchUrl, {
            params: {
                search: playerName,
                verein: clubFilter || ''
            },
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const results = [];

        $('table tbody tr').each((index, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 4) {
                const nameCell = $(cells[0]);
                const dwzCell = $(cells[1]);
                const clubCell = $(cells[2]);
                
                const playerLink = nameCell.find('a').attr('href');
                const zpk = playerLink ? playerLink.match(/zps=(\d+)/)?.[1] : null;
                
                const player = {
                    name: nameCell.text().trim(),
                    dwz: dwzCell.text().trim() || null,
                    club: clubCell.text().trim() || null,
                    zpk: zpk
                };
                
                if (player.name && player.zpk) {
                    results.push(player);
                }
            }
        });

        console.log(`   → Found ${results.length} player(s)`);
        results.forEach((player, i) => {
            console.log(`     ${i + 1}. ${player.name} (DWZ: ${player.dwz || 'N/A'}, Club: ${player.club || 'N/A'}, ZPK: ${player.zpk})`);
        });
        
        return results;
    } catch (error) {
        console.error('   ❌ Search error:', error.message);
        return [];
    }
}

async function testSearchVariations() {
    const searchVariations = [
        'kursawe,finn',
        'Kursawe,Finn',
        'kursawe finn',
        'Kursawe Finn',
        'kursawe', 
        'Kursawe',
        'finn kursawe',
        'Finn Kursawe'
    ];
    
    console.log('🧪 Testing different search variations:\n');
    
    for (const searchTerm of searchVariations) {
        const results = await searchDWZPlayer(searchTerm);
        
        if (results.length > 0) {
            console.log(`✅ Success with: "${searchTerm}"`);
            
            // Test chart generation for the first result
            const player = results[0];
            console.log(`\n🎯 Testing chart generation for: ${player.name} (ZPK: ${player.zpk})`);
            
            try {
                // Fetch tournament details
                const detailUrl = `https://www.schachbund.de/spieler/${player.zpk}.html`;
                const response = await axios.get(detailUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                const cheerio = require('cheerio');
                const $ = cheerio.load(response.data);
                
                // Try to find serialized tournament data
                const scriptTags = $('script');
                let tournamentSection = '';
                
                scriptTags.each((index, script) => {
                    const content = $(script).html();
                    if (content && content.includes('a:') && content.includes('turniername')) {
                        tournamentSection = content;
                        return false;
                    }
                });

                if (tournamentSection) {
                    // Extract tournaments
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
                        
                        tournaments.sort((a, b) => b.index - a.index);
                        
                        console.log(`   📊 Found ${tournaments.length} tournaments`);
                        tournaments.forEach((t, i) => {
                            console.log(`     ${i + 1}. ${t.turniername || 'Unknown'}: dwzalt="${t.dwzalt || 'N/A'}", dwzneu="${t.dwzneu || 'N/A'}"`);
                        });
                        
                        // Test chart generation
                        const { generateDWZChart } = require('./src/utils/chartGenerator');
                        const chartAttachment = await generateDWZChart(tournaments, player.name);
                        
                        if (chartAttachment) {
                            console.log('   ✅ Chart generated successfully!');
                            
                            const fs = require('fs');
                            if (fs.existsSync(chartAttachment.attachment)) {
                                fs.unlinkSync(chartAttachment.attachment);
                                console.log('   🧹 Test file cleaned up');
                            }
                        } else {
                            console.log('   ❌ Chart generation failed');
                        }
                    } else {
                        console.log('   ❌ No tournament matches found');
                    }
                } else {
                    console.log('   ❌ No tournament data found');
                }
                
            } catch (error) {
                console.error('   ❌ Error processing player:', error.message);
            }
            
            console.log('\n' + '─'.repeat(60) + '\n');
            return; // Stop after first successful search
        } else {
            console.log(`❌ No results for: "${searchTerm}"`);
        }
    }
    
    console.log('\n🎯 Conclusion:');
    console.log('==============');
    console.log('If no search variations worked, the player might:');
    console.log('• Have a different name format');
    console.log('• Not be in the DWZ database');
    console.log('• Have a typo in the name');
    console.log('• Be listed under a different spelling');
}

testSearchVariations().catch(console.error);
