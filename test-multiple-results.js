#!/usr/bin/env node

// Test multiple results behavior - minimal API requests
const axios = require('axios');
const cheerio = require('cheerio');

// Import the DWZ command logic
const { data, execute } = require('./src/commands/dwz.js');

async function testMultipleResults() {
    console.log('=== Testing Multiple Results Behavior ===\n');
    
    // Mock Discord interaction object
    const mockInteraction = {
        deferred: false,
        deferReply: async () => {
            mockInteraction.deferred = true;
            console.log('📤 Deferred reply');
        },
        editReply: async (content) => {
            console.log('\n🔷 Discord Embed Response:');
            if (content.embeds && content.embeds.length > 0) {
                const embed = content.embeds[0];
                console.log(`Title: ${embed.title}`);
                console.log(`Description: ${embed.description}`);
                if (embed.color) {
                    console.log(`Color: 0x${embed.color.toString(16).toUpperCase()}`);
                }
                console.log('\nFields:');
                if (embed.fields && embed.fields.length > 0) {
                    embed.fields.forEach(field => {
                        console.log(`  ${field.name}: ${field.value}`);
                    });
                } else {
                    console.log('  No fields');
                }
                if (embed.footer) {
                    console.log(`\nFooter: ${embed.footer.text}`);
                }
                if (embed.timestamp) {
                    console.log(`Timestamp: ${embed.timestamp}`);
                }
            } else {
                console.log('Content:', content);
            }
        },
        options: {
            getString: (name) => {
                return mockInteraction.currentQuery;
            }
        }
    };

    const testCases = [
        { 
            query: 'Müller', 
            description: 'Common name that should return multiple results' 
        },
        { 
            query: 'Schmidt', 
            description: 'Another common name with multiple matches' 
        },
        { 
            query: 'Olschimke', 
            description: 'Specific name that should return single result with full details' 
        }
    ];

    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`Testing: ${testCase.description}`);
        console.log(`Query: "${testCase.query}"`);
        console.log(`${'='.repeat(60)}`);
        
        mockInteraction.currentQuery = testCase.query;
        
        const startTime = Date.now();
        
        try {
            await execute(mockInteraction);
            const duration = Date.now() - startTime;
            console.log(`\n⏱️ Request completed in ${duration}ms`);
        } catch (error) {
            console.error(`❌ Test failed for "${testCase.query}":`, error.message);
        }
        
        // Wait a bit between requests to be respectful
        if (testCase !== testCases[testCases.length - 1]) {
            console.log('\n⏳ Waiting 2 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }

    console.log('\n✅ Multiple results test completed!\n');
    
    console.log('🎯 Expected Behavior:');
    console.log('  ✅ Multiple results: Simple list with DWZ and club only');
    console.log('  ✅ Single result: Full details with tournaments and ZPK');
    console.log('  ✅ Minimal API requests for multiple results');
    console.log('  ✅ German translations used throughout');
}

testMultipleResults().catch(console.error);
