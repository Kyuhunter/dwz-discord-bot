const axios = require('axios');
const cheerio = require('cheerio');

async function testDWZSearch(playerName) {
    console.log(`Testing search for: ${playerName}`);
    
    try {
        const searchUrl = `https://www.schachbund.de/spieler.html?search=${encodeURIComponent(playerName)}`;
        console.log(`URL: ${searchUrl}`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Referer': 'https://www.schachbund.de/spieler.html'
            },
            timeout: 10000
        });
        
        console.log(`✅ Status: ${response.status}`);
        console.log(`✅ Content length: ${response.data.length}`);
        
        const $ = cheerio.load(response.data);
        
        // Check page title to make sure we're on the right page
        const title = $('title').text();
        console.log(`Page title: ${title}`);
        
        // Look for any tables
        const tables = $('table');
        console.log(`Found ${tables.length} tables`);
        
        // Look for any player links
        const playerLinks = $('a[href*="spieler.html"][href*="pkz="]');
        console.log(`Found ${playerLinks.length} player links`);
        
        if (playerLinks.length > 0) {
            console.log('Sample player links:');
            playerLinks.slice(0, 3).each((i, link) => {
                console.log(`  - ${$(link).text()}: ${$(link).attr('href')}`);
            });
        }
        
        // Check for search result indicators
        const possibleResults = $('tr').filter((i, row) => {
            const text = $(row).text().toLowerCase();
            return text.includes(playerName.toLowerCase()) || 
                   text.includes('dwz') || 
                   text.includes('verein');
        });
        console.log(`Found ${possibleResults.length} potential result rows`);
        
        // Look for "no results" type messages
        const noResults = $('*').filter((i, el) => {
            const text = $(el).text().toLowerCase();
            return text.includes('keine') && text.includes('ergeb') ||
                   text.includes('nicht gefunden') ||
                   text.includes('no result');
        });
        console.log(`Found ${noResults.length} "no results" indicators`);
        
        if (noResults.length > 0) {
            console.log('No results messages:');
            noResults.slice(0, 2).each((i, el) => {
                console.log(`  - ${$(el).text().trim()}`);
            });
        }
        
        // Test with a more specific search
        if (possibleResults.length === 0 && playerName !== 'Schmidt') {
            console.log('\nTrying with a more common name: Schmidt');
            return await testDWZSearch('Schmidt');
        }
        
        return {
            success: true,
            status: response.status,
            tables: tables.length,
            playerLinks: playerLinks.length,
            potentialResults: possibleResults.length
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Status text: ${error.response.statusText}`);
        }
        return {
            success: false,
            error: error.message,
            status: error.response?.status
        };
    }
}

// Test with different names
if (require.main === module) {
    (async () => {
        console.log('🧪 DWZ Search Test Suite');
        console.log('========================\n');
        
        const testNames = ['Müller', 'Schmidt', 'Magnus'];
        
        for (const name of testNames) {
            console.log(`\n--- Testing: ${name} ---`);
            try {
                const result = await testDWZSearch(name);
                console.log('Result:', result);
            } catch (error) {
                console.error('Error:', error.message);
            }
            console.log(''); // spacing
        }
        
        console.log('🏁 Test suite completed');
    })();
}

module.exports = testDWZSearch;
