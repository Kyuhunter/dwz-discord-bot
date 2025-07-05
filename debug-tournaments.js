#!/usr/bin/env node

// Debug the tournament section structure
const axios = require('axios');

async function debugTournamentStructure() {
    console.log('=== Debugging Tournament Data Structure ===\n');
    
    const adrianZPK = '10157565';
    
    try {
        const detailsUrl = `http://www.schachbund.de/php/dewis/spieler.php?pkz=${adrianZPK}&format=array`;
        
        const response = await axios.get(detailsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000
        });
        
        const playerData = response.data;
        
        // Look for the tournament section
        console.log('Looking for tournament section...');
        
        // Find where "turnier" appears
        const turnierIndex = playerData.indexOf('turnier');
        if (turnierIndex !== -1) {
            console.log(`Found "turnier" at position ${turnierIndex}`);
            
            // Show context around the turnier section
            const start = Math.max(0, turnierIndex - 100);
            const end = Math.min(playerData.length, turnierIndex + 2000);
            const context = playerData.substring(start, end);
            
            console.log('\nContext around "turnier":');
            console.log(context);
            
            // Try different regex patterns
            console.log('\n=== Testing Different Patterns ===');
            
            // Pattern 1: Original
            const pattern1 = /s:7:"turnier";a:(\d+):\{(.*?)\}s:/;
            const match1 = playerData.match(pattern1);
            console.log('Pattern 1 result:', match1 ? 'MATCH' : 'NO MATCH');
            
            // Pattern 2: More flexible
            const pattern2 = /s:7:"turnier";a:(\d+):\{(.*?)\}$/;
            const match2 = playerData.match(pattern2);
            console.log('Pattern 2 result:', match2 ? 'MATCH' : 'NO MATCH');
            
            // Pattern 3: Even more flexible
            const pattern3 = /s:7:"turnier";a:(\d+):\{(.*)$/;
            const match3 = playerData.match(pattern3);
            console.log('Pattern 3 result:', match3 ? 'MATCH' : 'NO MATCH');
            
            if (match3) {
                const tournamentCount = parseInt(match3[1]);
                console.log(`\nFound ${tournamentCount} tournaments`);
                
                const tournamentSection = match3[2];
                console.log('Tournament section length:', tournamentSection.length);
                console.log('Tournament section (first 500 chars):', tournamentSection.substring(0, 500));
                
                // Look for individual tournaments
                const tournamentMatches = tournamentSection.match(/i:(\d+);a:\d+:\{([^}]+)\}/g);
                if (tournamentMatches) {
                    console.log(`\nFound ${tournamentMatches.length} individual tournaments`);
                    
                    // Show last few tournaments (highest indices)
                    const lastFew = tournamentMatches.slice(-5);
                    lastFew.forEach((match, index) => {
                        const tournamentMatch = match.match(/i:(\d+);a:\d+:\{([^}]+)\}/);
                        if (tournamentMatch) {
                            const tournamentIndex = parseInt(tournamentMatch[1]);
                            const tournamentData = tournamentMatch[2];
                            
                            console.log(`\nTournament ${tournamentIndex} (${lastFew.length - index} from end):`);
                            console.log('Data:', tournamentData.substring(0, 200) + '...');
                            
                            // Extract key fields
                            const nameMatch = tournamentData.match(/s:\d+:"turniername";s:\d+:"([^"]*)"/);
                            const codeMatch = tournamentData.match(/s:\d+:"turniercode";s:\d+:"([^"]*)"/);
                            
                            if (nameMatch) console.log(`Name: ${nameMatch[1]}`);
                            if (codeMatch) console.log(`Code: ${codeMatch[1]}`);
                        }
                    });
                } else {
                    console.log('❌ No individual tournament matches found');
                }
            }
            
        } else {
            console.log('❌ "turnier" not found in data');
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugTournamentStructure().catch(console.error);
