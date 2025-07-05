#!/usr/bin/env node

// Test the improved tournament parsing with the last 3 tournaments
const axios = require('axios');

async function testImprovedTournamentParsing() {
    console.log('=== Testing Improved Tournament Parsing ===\n');
    
    // Adrian Olschimke's ZPK
    const adrianZPK = '10157565';
    
    try {
        console.log(`Testing ZPK: ${adrianZPK}`);
        const detailsUrl = `http://www.schachbund.de/php/dewis/spieler.php?pkz=${adrianZPK}&format=array`;
        
        const response = await axios.get(detailsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
        });
        
        const playerData = response.data;
        console.log('Player data length:', playerData.length);
        
        // Parse tournament data - get all tournaments
        const details = {};
        
        // Extract tournament data - get all tournaments and find the most recent ones
        const tournamentSectionMatch = playerData.match(/s:7:"turnier";a:(\d+):\{(.*)$/);
        if (tournamentSectionMatch) {
            const tournamentCount = parseInt(tournamentSectionMatch[1]);
            const tournamentSection = tournamentSectionMatch[2];
            
            console.log(`\nFound tournament section with ${tournamentCount} tournaments`);
            console.log('Tournament section (first 1000 chars):', tournamentSection.substring(0, 1000));
            
            // Extract all tournaments
            const tournaments = [];
            const tournamentMatches = tournamentSection.match(/i:(\d+);a:\d+:\{([^}]+)\}/g);
            
            if (tournamentMatches) {
                console.log(`\nFound ${tournamentMatches.length} tournament matches`);
                
                tournamentMatches.forEach((match, matchIndex) => {
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
                            
                            if (matchIndex < 5) { // Show first 5 tournaments for debugging
                                console.log(`\nTournament ${index}:`);
                                console.log(`  Name: ${tournament.turniername}`);
                                console.log(`  Code: ${tournament.turniercode}`);
                                console.log(`  Score: ${tournament.punkte}/${tournament.partien}`);
                                console.log(`  DWZ: ${tournament.dwzalt} → ${tournament.dwzneu}`);
                                console.log(`  Performance: ${tournament.leistung}`);
                            }
                        }
                    }
                });
                
                // Sort tournaments by index (highest index = most recent)
                tournaments.sort((a, b) => b.index - a.index);
                
                console.log(`\n=== Last 3 Tournaments (Most Recent First) ===`);
                const lastThree = tournaments.slice(0, 3);
                lastThree.forEach((tournament, index) => {
                    const oldDwz = parseInt(tournament.dwzalt) || 0;
                    const newDwz = parseInt(tournament.dwzneu) || 0;
                    const change = newDwz - oldDwz;
                    
                    console.log(`\n${index + 1}. ${tournament.turniername}`);
                    console.log(`   Code: ${tournament.turniercode}`);
                    console.log(`   Score: ${tournament.punkte}/${tournament.partien}`);
                    console.log(`   Performance: ${tournament.leistung || 'N/A'}`);
                    console.log(`   DWZ Change: ${tournament.dwzalt} → ${tournament.dwzneu} (${change >= 0 ? '+' : ''}${change})`);
                });
                
                // Store the last 3 tournaments
                details.tournaments = lastThree;
                
                console.log(`\n✅ Successfully parsed ${tournaments.length} tournaments, stored last 3`);
            } else {
                console.log('❌ No tournament matches found');
            }
        } else {
            console.log('❌ No tournament section found');
        }
        
        return details;
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testImprovedTournamentParsing().catch(console.error);
