#!/usr/bin/env node

console.log('🔍 Debugging Chart Generation for Player: Finn Kursawe');
console.log('===================================================');

// Import the DWZ search functions
const axios = require('axios');
const cheerio = require('cheerio');

async function searchDWZPlayer(playerName, clubFilter = null) {
    try {
        console.log(`🔍 Searching for player: "${playerName}"`);
        
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

        console.log(`   Found ${results.length} players`);
        return results;
    } catch (error) {
        console.error('Search error:', error.message);
        return [];
    }
}

async function fetchDWZPlayerDetails(zpk) {
    try {
        console.log(`📊 Fetching details for ZPK: ${zpk}`);
        
        const detailUrl = `https://www.schachbund.de/spieler/${zpk}.html`;
        const response = await axios.get(detailUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const details = {};

        // Try to find serialized tournament data
        const scriptTags = $('script');
        let tournamentSection = '';
        
        scriptTags.each((index, script) => {
            const content = $(script).html();
            if (content && content.includes('a:') && content.includes('turniername')) {
                tournamentSection = content;
                return false; // Break the loop
            }
        });

        if (tournamentSection) {
            console.log('   Found tournament data section in script tags');
            
            // Extract all tournaments
            const tournaments = [];
            const tournamentMatches = tournamentSection.match(/i:(\d+);a:\d+:\{([^}]+)\}/g);
            
            if (tournamentMatches) {
                console.log(`   Found ${tournamentMatches.length} tournament matches`);
                
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
                
                console.log(`   Parsed ${tournaments.length} tournaments`);
                tournaments.forEach((t, i) => {
                    console.log(`   ${i + 1}. ${t.turniername || 'Unknown'}: dwzalt="${t.dwzalt || 'N/A'}", dwzneu="${t.dwzneu || 'N/A'}"`);
                });
                
                // Store all tournaments for chart generation
                details.tournaments = tournaments;
            } else {
                console.log('   No tournament matches found in script data');
            }
        } else {
            console.log('   No tournament section found in page');
        }

        return details;
    } catch (error) {
        console.error(`Error fetching player details for ZPK ${zpk}:`, error.message);
        return null;
    }
}

async function testKursaweFinn() {
    console.log('\n🎯 Step 1: Search for player "Finn Kursawe"');
    
    // Search for the player
    const searchResults = await searchDWZPlayer('Finn Kursawe');
    
    if (searchResults.length === 0) {
        console.log('❌ No players found with that name');
        return;
    }
    
    console.log(`✅ Found ${searchResults.length} player(s):`);
    searchResults.forEach((player, i) => {
        console.log(`   ${i + 1}. ${player.name} (DWZ: ${player.dwz || 'N/A'}, Club: ${player.club || 'N/A'}, ZPK: ${player.zpk})`);
    });
    
    // Test the first player found
    const targetPlayer = searchResults[0];
    console.log(`\n🎯 Step 2: Fetch tournament details for ${targetPlayer.name} (ZPK: ${targetPlayer.zpk})`);
    
    const details = await fetchDWZPlayerDetails(targetPlayer.zpk);
    
    if (!details || !details.tournaments) {
        console.log('❌ No tournament data found for this player');
        return;
    }
    
    console.log(`\n🎯 Step 3: Test chart generation`);
    const tournaments = details.tournaments;
    
    // Import and test chart generation with the actual debug logging
    const { generateDWZChart } = require('./src/utils/chartGenerator');
    
    try {
        const chartAttachment = await generateDWZChart(tournaments, targetPlayer.name);
        
        if (chartAttachment) {
            console.log('✅ Chart generated successfully!');
            console.log(`   File: ${chartAttachment.name}`);
            
            // Clean up test file
            const fs = require('fs');
            if (fs.existsSync(chartAttachment.attachment)) {
                const stats = fs.statSync(chartAttachment.attachment);
                console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
                fs.unlinkSync(chartAttachment.attachment);
                console.log('   Test file cleaned up');
            }
        } else {
            console.log('❌ Chart generation failed - no chart returned');
        }
    } catch (error) {
        console.error('❌ Chart generation error:', error.message);
    }
}

async function runDebugTest() {
    try {
        await testKursaweFinn();
    } catch (error) {
        console.error('Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
    
    console.log('\n🎯 Debug Summary:');
    console.log('=================');
    console.log('This test shows exactly what happens when searching for "kursawe,finn":');
    console.log('• Player search results');
    console.log('• Tournament data extraction');
    console.log('• Chart generation with debug logging');
    console.log('• Specific reason why chart may not be generated');
}

runDebugTest();
