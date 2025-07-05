#!/usr/bin/env node

console.log('🔍 Testing DWZ Search Functionality');
console.log('===================================');

const axios = require('axios');
const cheerio = require('cheerio');

async function testSearchFunctionality() {
    // Test with common German names to verify search is working
    const testNames = ['Schmidt', 'Müller', 'Wagner', 'Weber'];
    
    for (const name of testNames) {
        console.log(`\n🧪 Testing search with: "${name}"`);
        
        try {
            const searchUrl = 'https://www.schachbund.de/spieler.html';
            const response = await axios.get(searchUrl, {
                params: {
                    search: name
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
            
            if (results.length > 0) {
                console.log('   ✅ Search functionality is working!');
                
                // Show first few results
                results.slice(0, 3).forEach((player, i) => {
                    console.log(`     ${i + 1}. ${player.name} (DWZ: ${player.dwz || 'N/A'}, Club: ${player.club || 'N/A'}, ZPK: ${player.zpk})`);
                });
                
                // Test chart generation with the first player that has tournament data
                console.log(`\n🎯 Testing chart generation with first player: ${results[0].name}`);
                await testPlayerChartGeneration(results[0]);
                
                break; // Stop after successful test
            } else {
                console.log('   ❌ No results found');
            }
            
        } catch (error) {
            console.error(`   ❌ Error searching for ${name}:`, error.message);
        }
    }
}

async function testPlayerChartGeneration(player) {
    try {
        console.log(`   📊 Fetching tournament data for ${player.name} (ZPK: ${player.zpk})`);
        
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
                
                if (tournaments.length >= 3) {
                    console.log('   🎯 This player has 3+ tournaments - testing chart generation:');
                    tournaments.slice(0, 3).forEach((t, i) => {
                        console.log(`     ${i + 1}. ${t.turniername || 'Unknown'}: dwzalt="${t.dwzalt || 'N/A'}", dwzneu="${t.dwzneu || 'N/A'}"`);
                    });
                    
                    // Test chart generation with debug logging
                    const { generateDWZChart } = require('./src/utils/chartGenerator');
                    const chartAttachment = await generateDWZChart(tournaments, player.name);
                    
                    if (chartAttachment) {
                        console.log('   ✅ Chart generated successfully for 3+ tournaments!');
                        
                        const fs = require('fs');
                        if (fs.existsSync(chartAttachment.attachment)) {
                            const stats = fs.statSync(chartAttachment.attachment);
                            console.log(`   📊 Chart size: ${(stats.size / 1024).toFixed(1)} KB`);
                            fs.unlinkSync(chartAttachment.attachment);
                            console.log('   🧹 Test file cleaned up');
                        }
                    } else {
                        console.log('   ❌ Chart generation failed despite having 3+ tournaments');
                        console.log('   🔍 This indicates the same issue affecting "Finn Kursawe"');
                    }
                } else {
                    console.log(`   📊 Player only has ${tournaments.length} tournaments`);
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

async function runTest() {
    await testSearchFunctionality();
    
    console.log('\n🎯 Conclusions:');
    console.log('===============');
    console.log('If chart generation fails for players with 3+ tournaments,');
    console.log('the issue is likely in the tournament data validation logic.');
    console.log('The debug logging will show exactly what\'s happening.');
}

runTest().catch(console.error);
