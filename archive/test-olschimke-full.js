#!/usr/bin/env node

// Test the full DWZ search functionality with "Olschimke"
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

// Read and evaluate the dwz.js functions
const dwzCode = fs.readFileSync(path.join(__dirname, 'src', 'commands', 'dwz.js'), 'utf8');

// Extract the necessary functions
eval(`
async function searchDWZPlayer(playerName) {
    try {
        // Use the correct search endpoint from schachbund.de
        const searchUrl = \`https://www.schachbund.de/spieler.html?search=\${encodeURIComponent(playerName)}\`;
        
        console.log(\`Searching for: \${playerName} at \${searchUrl}\`);
        
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
        
        console.log(\`Response status: \${response.status}, content length: \${response.data.length}\`);
        
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
                
                console.log(\`Found \${rows.length} result rows\`);
                
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
                        
                        // Extract DWZ number (format might be "1253 - 39" where 1253 is the rating)
                        let dwz = null;
                        if (dwzText && dwzText !== '-----' && dwzText !== '') {
                            const dwzMatch = dwzText.match(/(\\d+)/);
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
                                pkz: null, // Not available in search results
                                link: null,
                                zpk: null // Will be fetched later if club is available
                            };
                            
                            players.push(player);
                            console.log(\`Added player: \${JSON.stringify(player)}\`);
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
        
        // Remove duplicates based on name and DWZ
        const uniquePlayers = players.filter((player, index, self) => 
            index === self.findIndex((p) => p.name === player.name && p.dwz === player.dwz)
        );
        
        console.log(\`Found \${uniquePlayers.length} unique players\`);
        
        // Enhance players with ZPK data if club information is available
        for (const player of uniquePlayers) {
            if (player.club && player.club !== 'Search on website for details') {
                try {
                    console.log(\`Fetching ZPK for player \${player.name} in club \${player.club}\`);
                    const zpk = await getPlayerZPK(player.name, player.club);
                    if (zpk) {
                        player.zpk = zpk;
                        console.log(\`Found ZPK \${zpk} for \${player.name}\`);
                    }
                } catch (error) {
                    console.log(\`Could not fetch ZPK for \${player.name}: \${error.message}\`);
                }
            }
        }
        
        return uniquePlayers;
        
    } catch (error) {
        console.error('DWZ Search Error:', error.message);
        throw error;
    }
}

${dwzCode.match(/async function parseAlternativeFormat[\s\S]*?(?=async function createPlayerEmbed|function extractPKZFromLink)/)[0]}

${dwzCode.match(/async function getClubZPS[\s\S]*?(?=async function getPlayerZPK)/)[0]}

${dwzCode.match(/async function getPlayerZPK[\s\S]*?(?=module\.exports)/)[0]}
`);

async function testOlschimkeFullSearch() {
    console.log('=== Testing Full DWZ Search for "Olschimke" ===\n');
    
    try {
        const results = await searchDWZPlayer('Olschimke');
        
        console.log(`\nFound ${results.length} results:`);
        results.forEach((player, index) => {
            console.log(`\n${index + 1}. ${player.name}`);
            console.log(`   DWZ: ${player.dwz || 'N/A'}`);
            console.log(`   Club: ${player.club || 'N/A'}`);
            console.log(`   ZPK: ${player.zpk || 'N/A'}`);
        });
        
        // Check if we found Adrian Olschimke specifically
        const adrianResult = results.find(p => 
            p.name.toLowerCase().includes('olschimke') && 
            p.name.toLowerCase().includes('adrian')
        );
        
        if (adrianResult) {
            console.log(`\n✅ Success! Found Adrian Olschimke:`);
            console.log(`   Name: ${adrianResult.name}`);
            console.log(`   DWZ: ${adrianResult.dwz}`);
            console.log(`   Club: ${adrianResult.club}`);
            console.log(`   ZPK: ${adrianResult.zpk}`);
            
            if (adrianResult.zpk === '10157565') {
                console.log(`\n🎉 ZPK matches expected value: 10157565`);
            } else if (adrianResult.zpk) {
                console.log(`\n⚠️ ZPK found but doesn't match expected. Expected: 10157565, Got: ${adrianResult.zpk}`);
            } else {
                console.log(`\n⚠️ No ZPK found for Adrian Olschimke`);
            }
        } else {
            console.log(`\n❌ Could not find Adrian Olschimke in results`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testOlschimkeFullSearch().catch(console.error);
