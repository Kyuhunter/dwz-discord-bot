const axios = require('axios');
const cheerio = require('cheerio');

async function testOlschimkeSearch() {
    try {
        console.log('Testing search for "Olschimke"...');
        
        const searchUrl = 'https://www.schachbund.de/spieler.html?search=Olschimke';
        const response = await axios.get(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            timeout: 10000
        });
        
        console.log(`✅ Status: ${response.status}`);
        
        const $ = cheerio.load(response.data);
        
        // Test the new parsing logic
        const searchResultDiv = $('.searchresult');
        console.log(`Found ${searchResultDiv.length} searchresult div(s)`);
        
        if (searchResultDiv.length > 0) {
            const bodyTable = searchResultDiv.find('table.body');
            console.log(`Found ${bodyTable.length} body table(s)`);
            
            if (bodyTable.length > 0) {
                const tbody = bodyTable.find('tbody');
                const rows = tbody.find('tr');
                console.log(`Found ${rows.length} result row(s)`);
                
                rows.each((index, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');
                    console.log(`Row ${index + 1} has ${cells.length} cells:`);
                    
                    cells.each((cellIndex, cell) => {
                        const cellText = $(cell).text().trim();
                        console.log(`  Cell ${cellIndex + 1}: "${cellText}"`);
                    });
                });
            }
        }
        
        // Also check what we get from manual table parsing
        console.log('\n--- Manual table check ---');
        $('table').each((tableIndex, table) => {
            const $table = $(table);
            const tableClass = $table.attr('class') || 'no-class';
            const rows = $table.find('tr');
            
            if (rows.length > 0) {
                console.log(`Table ${tableIndex + 1} (class: ${tableClass}) has ${rows.length} rows`);
                
                // Show first few rows
                rows.slice(0, 3).each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td, th');
                    const cellTexts = [];
                    cells.each((i, cell) => {
                        cellTexts.push($(cell).text().trim());
                    });
                    console.log(`  Row ${rowIndex + 1}: [${cellTexts.join(' | ')}]`);
                });
                
                if (rows.length > 3) {
                    console.log(`  ... and ${rows.length - 3} more rows`);
                }
            }
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testOlschimkeSearch();
