#!/usr/bin/env node

// Test the full DWZ search functionality including ZPK extraction
const { searchDWZPlayer, getPlayerZPK } = require('./src/commands/dwz.js');

async function testFullDWZSearch() {
    console.log('=== Testing Full DWZ Search with ZPK ===\n');
    
    try {
        // Extract the functions we need from the dwz.js module
        const dwzModule = require('./src/commands/dwz.js');
        
        // We need to access the functions that aren't exported
        // Let's test by creating a mock interaction and testing the search
        
        const testName = "Adrian Olschimke";
        console.log(`Testing search for: "${testName}"\n`);
        
        // We'll need to extract the search function manually since it's not exported
        // Let's create a simple test by requiring the file and accessing its internals
        
        const fs = require('fs');
        const path = require('path');
        
        // Read the dwz.js file to extract the searchDWZPlayer function
        const dwzCode = fs.readFileSync(path.join(__dirname, 'src', 'commands', 'dwz.js'), 'utf8');
        
        // Extract the searchDWZPlayer function by evaluating it
        const axios = require('axios');
        const cheerio = require('cheerio');
        
        // Copy the searchDWZPlayer function here for testing
        eval(`
            ${dwzCode.match(/async function searchDWZPlayer\([\s\S]*?(?=async function|module\.exports|$)/)[0]}
            ${dwzCode.match(/async function parseAlternativeFormat\([\s\S]*?(?=async function|function extractPKZFromLink|$)/)[0]}
            ${dwzCode.match(/async function getClubZPS\([\s\S]*?(?=async function|$)/)[0]}
            ${dwzCode.match(/async function getPlayerZPK\([\s\S]*?(?=module\.exports|$)/)[0]}
        `);
        
        // Now test the search
        const results = await searchDWZPlayer(testName);
        
        console.log(`Found ${results.length} results:`);
        results.forEach((player, index) => {
            console.log(`\n${index + 1}. ${player.name}`);
            console.log(`   DWZ: ${player.dwz || 'N/A'}`);
            console.log(`   Club: ${player.club || 'N/A'}`);
            console.log(`   ZPK: ${player.zpk || 'N/A'}`);
        });
        
        // Test specific case for Adrian Olschimke
        const adrianResults = results.filter(p => 
            p.name.toLowerCase().includes('olschimke') && 
            p.name.toLowerCase().includes('adrian')
        );
        
        if (adrianResults.length > 0) {
            const adrian = adrianResults[0];
            console.log(`\n✅ Success! Found Adrian Olschimke:`);
            console.log(`   Name: ${adrian.name}`);
            console.log(`   DWZ: ${adrian.dwz}`);
            console.log(`   Club: ${adrian.club}`);
            console.log(`   ZPK: ${adrian.zpk}`);
            
            if (adrian.zpk === '10157565') {
                console.log(`\n🎉 ZPK matches expected value: 10157565`);
            } else {
                console.log(`\n⚠️ ZPK doesn't match expected value. Expected: 10157565, Got: ${adrian.zpk}`);
            }
        } else {
            console.log(`\n❌ Could not find Adrian Olschimke in results`);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testFullDWZSearch().catch(console.error);
