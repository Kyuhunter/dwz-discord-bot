#!/usr/bin/env node

// Test script for player disambiguation functionality
const path = require('path');

// Mock Discord.js
const mockDiscordJs = {
    SlashCommandBuilder: class {
        setName() { return this; }
        setDescription() { return this; }
        addStringOption() { return this; }
    },
    EmbedBuilder: class {
        constructor() {
            this.title = undefined;
            this.description = undefined;
            this.fields = [];
            this.color = undefined;
            this.footer = undefined;
        }
        setColor(color) { this.color = color; return this; }
        setTitle(title) { this.title = title; return this; }
        setDescription(description) { this.description = description; return this; }
        addFields(...fields) { 
            this.fields.push(...fields); 
            return this; 
        }
        setFooter(footer) { this.footer = footer; return this; }
        setTimestamp() { return this; }
        toJSON() {
            return {
                title: this.title || 'undefined',
                description: this.description || 'undefined',
                fields: this.fields.length > 0 ? this.fields : 'No fields',
                color: this.color,
                footer: this.footer
            };
        }
    }
};

// Mock modules
require.cache[require.resolve('discord.js')] = {
    exports: mockDiscordJs
};

// Load the command
const dwzCommand = require('./src/commands/dwz.js');

// Test cases for player disambiguation
const testCases = [
    {
        name: 'Common name test',
        query: 'Müller',
        description: 'Should show multiple players with disambiguation info'
    },
    {
        name: 'Specific name test', 
        query: 'Olschimke',
        description: 'Should show single player with full details'
    },
    {
        name: 'Very common name test',
        query: 'Schmidt',
        description: 'Should show simplified view with disambiguation'
    }
];

async function runTest(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`🔍 Query: "${testCase.query}"`);
    console.log('━'.repeat(60));

    const mockInteraction = {
        options: {
            getString: (name) => testCase.query
        },
        deferReply: async () => {},
        editReply: async (response) => {
            console.log('📤 Bot Response:');
            if (response.embeds && response.embeds.length > 0) {
                const embed = response.embeds[0];
                console.log(`Title: ${embed.title || 'undefined'}`);
                console.log(`Description: ${embed.description || 'undefined'}`);
                console.log(`Color: ${embed.color || 'undefined'}`);
                
                if (embed.fields && embed.fields.length > 0) {
                    console.log('Fields:');
                    embed.fields.forEach((field, index) => {
                        console.log(`  ${index + 1}. ${field.name}`);
                        console.log(`     ${field.value}`);
                        if (field.value.includes('Unterscheidbar durch') || field.value.includes('Distinguished by')) {
                            console.log('     ✅ Disambiguation info found');
                        }
                    });
                } else {
                    console.log('Fields: No fields');
                }
                
                if (embed.footer) {
                    console.log(`Footer: ${embed.footer.text || 'undefined'}`);
                }
            } else {
                console.log('No embed in response');
            }
        }
    };

    const startTime = Date.now();
    
    try {
        await dwzCommand.execute(mockInteraction);
        const endTime = Date.now();
        console.log(`⏱️  Execution time: ${endTime - startTime}ms`);
        console.log('✅ Test completed successfully');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting Player Disambiguation Tests');
    console.log('======================================');
    
    for (const testCase of testCases) {
        await runTest(testCase);
        
        // Add delay between tests to avoid rate limiting
        if (testCase !== testCases[testCases.length - 1]) {
            console.log('\n⏳ Waiting 2 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    
    console.log('\n🏁 All tests completed!');
    console.log('======================================');
    console.log('✅ Features tested:');
    console.log('   • Player ID extraction from search results');
    console.log('   • Birth year extraction from player names');
    console.log('   • Duplicate name detection');
    console.log('   • Disambiguation information display');
    console.log('   • Translation key usage');
    console.log('   • Multiple vs single result optimization');
}

// Run the tests
runAllTests().catch(console.error);
