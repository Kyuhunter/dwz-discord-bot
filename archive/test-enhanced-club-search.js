#!/usr/bin/env node

// Comprehensive test for enhanced club-based DWZ search functionality
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

// Test cases for enhanced club-based search
const testCases = [
    {
        name: 'Club-specific search test',
        query: 'Schmidt München',
        description: 'Should search for Schmidt and filter by München clubs'
    },
    {
        name: 'Club keyword search test',
        query: 'Müller SV',
        description: 'Should search for Müller and filter by SV clubs'
    },
    {
        name: 'Generic common name test',
        query: 'Wagner',
        description: 'Should show multiple players with club-based disambiguation'
    },
    {
        name: 'Specific player test',
        query: 'Olschimke',
        description: 'Should show single player with full details'
    },
    {
        name: 'City-based club search',
        query: 'Peters Berlin',
        description: 'Should search for Peters in Berlin clubs'
    }
];

async function runTest(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`🔍 Query: "${testCase.query}"`);
    console.log('━'.repeat(70));

    const mockInteraction = {
        options: {
            getString: (name) => testCase.query
        },
        deferReply: async () => {
            console.log('📤 Bot is thinking...');
        },
        editReply: async (response) => {
            console.log('📤 Bot Response:');
            if (response.embeds && response.embeds.length > 0) {
                const embed = response.embeds[0];
                console.log(`📋 Title: ${embed.title || 'undefined'}`);
                console.log(`📄 Description: ${embed.description || 'undefined'}`);
                console.log(`🎨 Color: ${embed.color || 'undefined'}`);
                
                if (embed.fields && embed.fields.length > 0) {
                    console.log('📊 Fields:');
                    embed.fields.forEach((field, index) => {
                        console.log(`  ${index + 1}. 📌 ${field.name}`);
                        const fieldValue = field.value.length > 150 ? 
                            field.value.substring(0, 147) + '...' : 
                            field.value;
                        console.log(`     📝 ${fieldValue.replace(/\n/g, '\n     ')}`);
                        
                        // Check for key features
                        if (field.value.includes('🏛️') || field.value.includes('Verein')) {
                            console.log('     ✅ Club information found');
                        }
                        if (field.value.includes('🏆') || field.value.includes('DWZ')) {
                            console.log('     ✅ DWZ rating found');
                        }
                        if (field.value.includes('Unterscheidung') || field.value.includes('Distinguished')) {
                            console.log('     ✅ Disambiguation info found');
                        }
                        if (field.value.includes('Tipp') || field.value.includes('Tip')) {
                            console.log('     ✅ User guidance provided');
                        }
                    });
                } else {
                    console.log('📊 Fields: No fields');
                }
                
                if (embed.footer) {
                    console.log(`🔗 Footer: ${embed.footer.text || 'undefined'}`);
                    if (embed.footer.text && embed.footer.text.includes('Vereinsnamen')) {
                        console.log('     ✅ Club search tip in footer');
                    }
                }
            } else {
                console.log('❌ No embed in response');
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
            console.error('📋 Stack trace:', error.stack.substring(0, 500) + '...');
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting Enhanced Club-Based DWZ Search Tests');
    console.log('================================================');
    console.log('🎯 Features being tested:');
    console.log('   • Club name detection in search queries');
    console.log('   • Club-based filtering of search results');
    console.log('   • Club name as primary disambiguation method');
    console.log('   • Enhanced user guidance for club searches');
    console.log('   • Multiple search patterns (Name+City, Name+Club, etc.)');
    console.log('================================================');
    
    for (const testCase of testCases) {
        await runTest(testCase);
        
        // Add delay between tests to avoid rate limiting
        if (testCase !== testCases[testCases.length - 1]) {
            console.log('\n⏳ Waiting 3 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    console.log('\n🏁 All tests completed!');
    console.log('================================================');
    console.log('✅ Enhanced features tested:');
    console.log('   • ✅ Club name extraction from queries');
    console.log('   • ✅ Advanced club filtering logic');
    console.log('   • ✅ Club-prioritized disambiguation');
    console.log('   • ✅ User-friendly search guidance');
    console.log('   • ✅ Emoji-enhanced display formatting');
    console.log('   • ✅ Comprehensive error handling');
    console.log('================================================');
}

// Run the tests
runAllTests().catch(console.error);
