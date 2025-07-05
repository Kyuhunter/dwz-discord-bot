#!/usr/bin/env node

// Test the DWZ search with just lastname
const axios = require('axios');
const cheerio = require('cheerio');

async function testOlschimkeSearch() {
    console.log('=== Testing DWZ Search for "Olschimke" ===\n');
    
    try {
        const searchUrl = `https://www.schachbund.de/spieler.html?search=${encodeURIComponent('Olschimke')}`;
        console.log(`Searching at: ${searchUrl}`);
        
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
                'Referer': 'https://www.schachbund.de/spieler.html'
            },
            timeout: 15000
        });
        
        console.log(`Response status: ${response.status}, content length: ${response.data.length}`);
        
        const $ = cheerio.load(response.data);
        
        // Look for search results
        const searchResultDiv = $('.searchresult');
        console.log(`Found ${searchResultDiv.length} searchresult divs`);
        
        if (searchResultDiv.length > 0) {
            const bodyTable = searchResultDiv.find('table.body');
            console.log(`Found ${bodyTable.length} body tables`);
            
            if (bodyTable.length > 0) {
                const tbody = bodyTable.find('tbody');
                const rows = tbody.find('tr');
                console.log(`Found ${rows.length} result rows`);
                
                rows.each((index, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    console.log(`Row ${index + 1}: ${cells.length} cells`);
                    
                    if (cells.length >= 5) {
                        const name = $(cells[0]).text().trim();
                        const dwz = $(cells[2]).text().trim();
                        const club = $(cells[4]).text().trim();
                        
                        console.log(`  Name: "${name}"`);
                        console.log(`  DWZ: "${dwz}"`);
                        console.log(`  Club: "${club}"`);
                        console.log('  ---');
                    }
                });
            }
        }
        
        // Check if we can find any mention of Olschimke in the page
        const pageText = $('body').text();
        const olschimkeMatches = pageText.match(/Olschimke[^,\n]*/gi);
        if (olschimkeMatches) {
            console.log('\nFound Olschimke mentions in page:');
            olschimkeMatches.forEach((match, index) => {
                console.log(`  ${index + 1}. "${match.trim()}"`);
            });
        }
        
    } catch (error) {
        console.error('❌ Search failed:', error.message);
    }
}

testOlschimkeSearch().catch(console.error);
