#!/usr/bin/env node

// Test the updated player details parsing
const axios = require('axios');

async function testUpdatedPlayerDetails() {
    console.log('=== Testing Updated Player Details Parsing ===\n');
    
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
        console.log('Player data (first 500 chars):', playerData.substring(0, 500));
        
        // Parse PHP serialized data manually for the "spieler" section
        const details = {};
        
        // Extract spieler data - look for s:7:"spieler";a:XX:{...}
        const spielerMatch = playerData.match(/s:7:"spieler";a:\d+:\{([^}]+)\}/);
        if (spielerMatch) {
            const spielerData = spielerMatch[1];
            console.log('\nFound spieler data:', spielerData);
            
            // Parse individual fields from the spieler data
            // Format: s:2:"id";s:8:"10157565";s:8:"nachname";s:9:"Olschimke";...
            const fieldMatches = spielerData.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/g);
            if (fieldMatches) {
                console.log(`\nFound ${fieldMatches.length} field matches:`);
                for (let i = 0; i < fieldMatches.length; i += 1) {
                    const match = fieldMatches[i];
                    const fieldParts = match.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/);
                    if (fieldParts) {
                        const key = fieldParts[1];
                        const value = fieldParts[2];
                        details[key] = value;
                        console.log(`  ${key} = "${value}"`);
                    }
                }
            }
        }
        
        // Extract mitgliedschaft data (club membership)
        const mitgliedschaftMatch = playerData.match(/s:14:"mitgliedschaft";a:\d+:\{[^}]*i:0;a:\d+:\{([^}]+)\}/);
        if (mitgliedschaftMatch) {
            const mitgliedschaftData = mitgliedschaftMatch[1];
            console.log('\nFound mitgliedschaft data:', mitgliedschaftData);
            const memberFieldMatches = mitgliedschaftData.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/g);
            if (memberFieldMatches) {
                console.log(`\nFound ${memberFieldMatches.length} membership field matches:`);
                for (let i = 0; i < memberFieldMatches.length; i += 1) {
                    const match = memberFieldMatches[i];
                    const fieldParts = match.match(/s:\d+:"([^"]+)";s:\d+:"([^"]*)"/);
                    if (fieldParts) {
                        const key = 'member_' + fieldParts[1];
                        const value = fieldParts[2];
                        details[key] = value;
                        console.log(`  ${key} = "${value}"`);
                    }
                }
            }
        }
        
        console.log('\n=== Final Parsed Details ===');
        console.log(JSON.stringify(details, null, 2));
        
        // Show what we would display in Discord
        console.log('\n=== Discord Display Preview ===');
        console.log(`Name: ${details.vorname} ${details.nachname}`);
        console.log(`DWZ: ${details.dwz} (Index: ${details.dwzindex})`);
        console.log(`FIDE: ${details.fideelo || 'N/A'} (ID: ${details.fideid || 'N/A'})`);
        console.log(`Club: ${details.member_vereinsname || 'N/A'}`);
        console.log(`Member Number: ${details.member_zpsmgl || 'N/A'}`);
        console.log(`Status: ${details.member_status || 'Active'}`);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testUpdatedPlayerDetails().catch(console.error);
