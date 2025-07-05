const axios = require('axios');
const cheerio = require('cheerio');

// Test the name parsing logic
function testNameParsing() {
    console.log('=== Testing Name Parsing ===');
    
    const testNames = [
        'Olschimke, Adrian',
        'Schmidt, Hans Peter',
        'Müller',
        'Klaus Weber',
        'Maria Elena Gonzalez'
    ];
    
    testNames.forEach(playerName => {
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
        
        console.log(`Input: "${playerName}" -> Lastname: "${searchLastname}", Firstname: "${searchFirstname}"`);
    });
}

// Test ZPK extraction from XML
async function testZPKExtraction() {
    console.log('\n=== Testing ZPK Extraction ===');
    
    try {
        // Test with a known ZPS (you can replace this with a real ZPS)
        const testZPS = '65129'; // Schachclub Steinfurt 1996 e V
        const xmlUrl = `http://www.schachbund.de/php/dewis/verein.php?zps=${testZPS}&format=xml`;
        
        console.log(`Testing XML URL: ${xmlUrl}`);
        
        const response = await axios.get(xmlUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/xml,text/xml,*/*'
            },
            timeout: 10000
        });
        
        console.log(`XML Response status: ${response.status}`);
        console.log(`XML Content length: ${response.data.length}`);
        
        const $ = cheerio.load(response.data, { xmlMode: true });
        
        // Look for player elements and show structure
        const spielers = $('Spieler'); // Capital S as shown in the XML
        console.log(`Found ${spielers.length} 'Spieler' elements`);
        
        if (spielers.length > 0) {
            console.log('\nFirst 3 players in XML:');
            for (let i = 0; i < Math.min(3, spielers.length); i++) {
                const $spieler = $(spielers[i]);
                const xmlLastname = $spieler.find('nachname').text().trim();
                const xmlFirstname = $spieler.find('vorname').text().trim();
                const zpk = $spieler.find('id').text().trim(); // The ID is the ZPK
                const dwz = $spieler.find('dwz').text().trim();
                
                const xmlPlayerName = xmlFirstname ? `${xmlFirstname} ${xmlLastname}` : xmlLastname;
                
                console.log(`  ${i + 1}. Name: "${xmlPlayerName}"`);
                console.log(`     Lastname: "${xmlLastname}", Firstname: "${xmlFirstname}"`);
                console.log(`     ZPK: ${zpk}, DWZ: ${dwz}`);
                console.log(`     ---`);
            }
        }
        
        // Test matching with different name formats
        const testSearches = [
            'Olschimke, Adrian',
            'Adrian Olschimke',
            'Olschimke'
        ];
        
        console.log('\nTesting name matching:');
        testSearches.forEach(searchName => {
            console.log(`\nSearching for: "${searchName}"`);
            
            // Parse search name
            let searchLastname = '';
            let searchFirstname = '';
            
            if (searchName.includes(',')) {
                const parts = searchName.split(',').map(part => part.trim());
                searchLastname = parts[0] || '';
                searchFirstname = parts[1] || '';
            } else {
                const nameParts = searchName.trim().split(/\s+/);
                if (nameParts.length >= 2) {
                    searchFirstname = nameParts.slice(0, -1).join(' ');
                    searchLastname = nameParts[nameParts.length - 1];
                } else {
                    searchLastname = nameParts[0] || '';
                }
            }
            
            console.log(`  Parsed as: lastname="${searchLastname}", firstname="${searchFirstname}"`);
            
            // Look for matches
            let found = false;
            for (let i = 0; i < spielers.length; i++) {
                const $spieler = $(spielers[i]);
                const xmlLastname = $spieler.find('nachname').text().trim();
                const xmlFirstname = $spieler.find('vorname').text().trim();
                const zpk = $spieler.find('id').text().trim(); // The ID is the ZPK
                
                const xmlPlayerName = xmlFirstname ? `${xmlFirstname} ${xmlLastname}` : xmlLastname;
                
                // Try matching
                let isMatch = false;
                
                if (xmlLastname && xmlFirstname && searchLastname && searchFirstname) {
                    const lastnameMatch = xmlLastname.toLowerCase().includes(searchLastname.toLowerCase()) ||
                                        searchLastname.toLowerCase().includes(xmlLastname.toLowerCase());
                    const firstnameMatch = xmlFirstname.toLowerCase().includes(searchFirstname.toLowerCase()) ||
                                         searchFirstname.toLowerCase().includes(xmlFirstname.toLowerCase());
                    
                    if (lastnameMatch && firstnameMatch) {
                        isMatch = true;
                    }
                }
                
                if (!isMatch && searchLastname && !searchFirstname && xmlLastname) {
                    const lastnameOnlyMatch = xmlLastname.toLowerCase().includes(searchLastname.toLowerCase()) ||
                                            searchLastname.toLowerCase().includes(xmlLastname.toLowerCase());
                    if (lastnameOnlyMatch) {
                        isMatch = true;
                    }
                }
                
                if (isMatch) {
                    console.log(`  ✅ Match: "${xmlPlayerName}" (ZPK: ${zpk})`);
                    found = true;
                    break;
                }
            }
            
            if (!found) {
                console.log(`  ❌ No match found`);
            }
        });
        
    } catch (error) {
        console.error(`Error testing ZPK extraction: ${error.message}`);
    }
}

async function runTests() {
    testNameParsing();
    await testZPKExtraction();
}

runTests().catch(console.error);
