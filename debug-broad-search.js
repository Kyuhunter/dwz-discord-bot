#!/usr/bin/env node

console.log('🔍 Broad Search for Players with "Finn" or "Kursawe"');
console.log('====================================================');

const axios = require('axios');
const cheerio = require('cheerio');

async function searchDWZPlayer(playerName, clubFilter = null) {
    try {
        console.log(`🔍 Searching for: "${playerName}"`);
        
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
        results.slice(0, 10).forEach((player, i) => { // Show only first 10
            console.log(`     ${i + 1}. ${player.name} (DWZ: ${player.dwz || 'N/A'}, Club: ${player.club || 'N/A'}, ZPK: ${player.zpk})`);
        });
        if (results.length > 10) {
            console.log(`     ... and ${results.length - 10} more`);
        }
        
        return results;
    } catch (error) {
        console.error('   ❌ Search error:', error.message);
        return [];
    }
}

async function testSpecificPlayer(player) {
    console.log(`\n🎯 Testing chart generation for: ${player.name} (ZPK: ${player.zpk})`);
    
    try {
        // Fetch tournament details
        const detailUrl = `https://www.schachbund.de/spieler/${player.zpk}.html`;
        const response = await axios.get(detailUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

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
                
                // Test chart generation with debug logging
                const { generateDWZChart } = require('./src/utils/chartGenerator');
                const chartAttachment = await generateDWZChart(tournaments, player.name);
                
                if (chartAttachment) {
                    console.log('   ✅ Chart generated successfully!');
                    
                    const fs = require('fs');
                    if (fs.existsSync(chartAttachment.attachment)) {
                        const stats = fs.statSync(chartAttachment.attachment);
                        console.log(`   📊 Chart size: ${(stats.size / 1024).toFixed(1)} KB`);
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
}

async function runBroadSearch() {
    const searchTerms = ['Finn', 'Kursawe'];
    
    for (const term of searchTerms) {
        console.log(`\n🔍 Searching for players with "${term}":`);
        const results = await searchDWZPlayer(term);
        
        if (results.length > 0) {
            // Look for any player with both "Finn" and "Kursawe" in the name
            const finnKursawePlayers = results.filter(player => 
                player.name.toLowerCase().includes('finn') && 
                player.name.toLowerCase().includes('kursawe')
            );
            
            if (finnKursawePlayers.length > 0) {
                console.log(`\n🎯 Found potential match(es):`);
                finnKursawePlayers.forEach((player, i) => {
                    console.log(`   ${i + 1}. ${player.name} (DWZ: ${player.dwz || 'N/A'}, Club: ${player.club || 'N/A'}, ZPK: ${player.zpk})`);
                });
                
                // Test the first match
                await testSpecificPlayer(finnKursawePlayers[0]);
                return; // Stop after finding and testing one
            }
            
            // If no exact match, test a player with just "Finn" or just "Kursawe"
            if (term === 'Finn' && results.length > 0) {
                console.log(`\n🧪 Testing first player with "Finn" for comparison:`);
                await testSpecificPlayer(results[0]);
                return;
            }
        }
        
        console.log('\n' + '─'.repeat(60));
    }
    
    console.log('\n🎯 Summary:');
    console.log('===========');
    console.log('If no players were found with "Finn Kursawe", possible reasons:');
    console.log('• The player name might have a different spelling');
    console.log('• The player might not be in the DWZ database');
    console.log('• The name format might be different (e.g., "Kursawe, Finn")');
    console.log('• There might be special characters or umlauts');
}

runBroadSearch().catch(console.error);
