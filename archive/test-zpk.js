const axios = require('axios');
const cheerio = require('cheerio');

// Import the functions from dwz.js (we'll need to adjust this)
async function getClubZPS(clubName) {
    try {
        // Clean club name - only keep letters, spaces, and numbers
        const cleanClubName = clubName.replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '').trim();
        console.log(`Cleaned club name from "${clubName}" to "${cleanClubName}"`);
        
        const searchUrl = `https://www.schachbund.de/verein.html?search=${encodeURIComponent(cleanClubName)}`;
        console.log(`Searching for club ZPS: ${cleanClubName} at ${searchUrl}`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Referer': 'https://www.schachbund.de/verein.html'
            },
            timeout: 10000,
            maxRedirects: 5 // Allow redirects
        });
        
        // Check if we were redirected to a specific club page
        const finalUrl = response.request.res.responseUrl || response.config.url;
        console.log(`Final URL after redirects: ${finalUrl}`);
        
        // Check if the final URL contains the ZPS pattern
        const urlZpsMatch = finalUrl.match(/\/verein\/(\d+)\.html/);
        if (urlZpsMatch) {
            console.log(`Found ZPS ${urlZpsMatch[1]} from redirect URL: ${finalUrl}`);
            return urlZpsMatch[1];
        }
        
        const $ = cheerio.load(response.data);
        
        // Look for any link that contains zps parameter in the URL
        const links = $('a[href*="zps="]');
        console.log(`Found ${links.length} links with ZPS parameter`);
        
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            const href = $(link).attr('href');
            const zpsMatch = href.match(/zps=(\d+)/);
            if (zpsMatch) {
                const linkText = $(link).text().trim();
                console.log(`Checking link: "${linkText}" with ZPS ${zpsMatch[1]}`);
                
                // Check if the link text matches our cleaned club name
                const cleanLinkText = linkText.replace(/[^a-zA-ZäöüÄÖÜß0-9\s]/g, '').trim();
                if (cleanLinkText.toLowerCase().includes(cleanClubName.toLowerCase()) ||
                    cleanClubName.toLowerCase().includes(cleanLinkText.toLowerCase())) {
                    console.log(`Found ZPS ${zpsMatch[1]} for club ${linkText} via URL`);
                    return zpsMatch[1];
                }
            }
        }
        
        console.log(`No ZPS found for club: ${cleanClubName}`);
        return null;
        
    } catch (error) {
        console.error(`Error fetching ZPS for club ${clubName}:`, error.message);
        return null;
    }
}

async function testZPK() {
    console.log('Testing ZPK functionality...');
    
    // Test with different club names
    const testClubs = [
        'Schachclub Steinfurt 1996 e V',
        'SV Weiden',
        'SK Turm Emsdetten'
    ];
    
    for (const testClub of testClubs) {
        console.log(`\n=== Testing with club: ${testClub} ===`);
        
        const zps = await getClubZPS(testClub);
        
        if (zps) {
            console.log(`✅ Found ZPS: ${zps}`);
            
            // Test the XML endpoint
            const xmlUrl = `http://www.schachbund.de/php/dewis/verein.php?zps=${zps}&format=xml`;
            console.log(`\n=== Testing XML endpoint: ${xmlUrl} ===`);
            
            try {
                const response = await axios.get(xmlUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/xml,text/xml,*/*'
                    },
                    timeout: 10000
                });
                
                console.log(`XML Response status: ${response.status}`);
                console.log(`XML Content length: ${response.data.length}`);
                console.log(`XML Content preview:`);
                console.log(response.data.substring(0, 500) + '...');
                
                const $ = cheerio.load(response.data, { xmlMode: true });
                
                // Look for player elements
                const spielers = $('spieler');
                console.log(`Found ${spielers.length} 'spieler' elements`);
                
                const players = $('player');
                console.log(`Found ${players.length} 'player' elements`);
                
                // Show first few players
                if (spielers.length > 0) {
                    console.log('\nFirst few players:');
                    for (let i = 0; i < Math.min(3, spielers.length); i++) {
                        const $spieler = $(spielers[i]);
                        const name = $spieler.find('spielername').text().trim();
                        const zpk = $spieler.find('zpk').text().trim() || $spieler.attr('zpk');
                        console.log(`  ${i + 1}. ${name} (ZPK: ${zpk})`);
                    }
                }
                
                break; // Stop after first successful test
                
            } catch (error) {
                console.error(`Error fetching XML: ${error.message}`);
            }
            
        } else {
            console.log(`❌ Could not find ZPS for club: ${testClub}`);
        }
    }
}

testZPK().catch(console.error);
