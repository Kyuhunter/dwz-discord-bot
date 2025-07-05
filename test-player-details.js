#!/usr/bin/env node

// Test the new player details endpoint using ZPK/PKZ
const axios = require('axios');

async function testPlayerDetails() {
    console.log('=== Testing Player Details Endpoint ===\n');
    
    // Adrian Olschimke's ZPK from the XML data
    const adrianZPK = '10157565';
    
    try {
        console.log(`Testing ZPK: ${adrianZPK}`);
        const detailsUrl = `http://www.schachbund.de/php/dewis/spieler.php?pkz=${adrianZPK}&format=array`;
        console.log(`URL: ${detailsUrl}`);
        
        const response = await axios.get(detailsUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 10000
        });
        
        console.log(`\nResponse Status: ${response.status}`);
        console.log(`Content Type: ${response.headers['content-type']}`);
        console.log(`Content Length: ${response.data.length}`);
        
        console.log('\n=== Raw Response Data ===');
        console.log(response.data);
        
        // Try to parse the array format
        console.log('\n=== Attempting to Parse Array Format ===');
        
        const playerData = response.data;
        const details = {};
        
        // Parse array format - looking for patterns like [field] => value
        const arrayMatches = playerData.match(/\[([^\]]+)\]\s*=>\s*([^\n\r]+)/g);
        if (arrayMatches) {
            console.log(`Found ${arrayMatches.length} field matches:`);
            arrayMatches.forEach((match, index) => {
                const fieldMatch = match.match(/\[([^\]]+)\]\s*=>\s*(.+)/);
                if (fieldMatch) {
                    const key = fieldMatch[1].trim();
                    const value = fieldMatch[2].trim();
                    details[key] = value;
                    console.log(`  ${index + 1}. ${key} = ${value}`);
                }
            });
        }
        
        console.log('\n=== Parsed Player Details Object ===');
        console.log(JSON.stringify(details, null, 2));
        
        // Test with a few more ZPKs from the XML
        console.log('\n=== Testing Additional Players ===');
        
        const testZPKs = [
            { zpk: '10065041', name: 'Matthias Grälken' },
            { zpk: '10053758', name: 'Michael Freitag' },
            { zpk: '10053747', name: 'Julia Freitag' }
        ];
        
        for (const testPlayer of testZPKs) {
            console.log(`\nTesting ${testPlayer.name} (ZPK: ${testPlayer.zpk}):`);
            try {
                const testUrl = `http://www.schachbund.de/php/dewis/spieler.php?pkz=${testPlayer.zpk}&format=array`;
                const testResponse = await axios.get(testUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    },
                    timeout: 10000
                });
                
                console.log(`  Status: ${testResponse.status}, Length: ${testResponse.data.length}`);
                
                // Extract key fields
                const testData = testResponse.data;
                const dwzMatch = testData.match(/\[DWZ\]\s*=>\s*([^\n\r]+)/);
                const nameMatch = testData.match(/\[Spielername\]\s*=>\s*([^\n\r]+)/);
                const fideMatch = testData.match(/\[FIDE_Elo\]\s*=>\s*([^\n\r]+)/);
                
                console.log(`  Name: ${nameMatch ? nameMatch[1].trim() : 'N/A'}`);
                console.log(`  DWZ: ${dwzMatch ? dwzMatch[1].trim() : 'N/A'}`);
                console.log(`  FIDE: ${fideMatch ? fideMatch[1].trim() : 'N/A'}`);
                
            } catch (error) {
                console.log(`  Error: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error(`Response status: ${error.response.status}`);
            console.error(`Response data: ${error.response.data}`);
        }
    }
}

testPlayerDetails().catch(console.error);
