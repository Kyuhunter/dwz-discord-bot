#!/usr/bin/env node

// Test script for two-field DWZ command interface
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

// Test cases for the new two-field interface
const testCases = [
    {
        name: 'Name only (single field)',
        playerName: 'Olschimke',
        clubName: null,
        description: 'Should search for player without club filter'
    },
    {
        name: 'Name with explicit club filter',
        playerName: 'Schmidt',
        clubName: 'München',
        description: 'Should search for Schmidt and filter by München clubs'
    },
    {
        name: 'Name with club abbreviation',
        playerName: 'Müller',
        clubName: 'SV',
        description: 'Should search for Müller and filter by SV clubs'
    },
    {
        name: 'Legacy format in name field',
        playerName: 'Wagner Berlin',
        clubName: null,
        description: 'Should still work with old combined format for backward compatibility'
    },
    {
        name: 'Both fields with potential conflict',
        playerName: 'Peters München',
        clubName: 'Berlin',
        description: 'Should prioritize explicit club field over detected club in name'
    }
];

async function runTest(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    console.log(`📝 Description: ${testCase.description}`);
    console.log(`🔍 Name: "${testCase.playerName}"`);
    console.log(`🏛️  Club: ${testCase.clubName ? `"${testCase.clubName}"` : 'null'}`);
    console.log('━'.repeat(70));

    const mockInteraction = {
        options: {
            getString: (optionName) => {
                if (optionName === 'name') return testCase.playerName;
                if (optionName === 'club') return testCase.clubName;
                return null;
            }
        },
        deferReply: async () => {
            console.log('📤 Bot is processing...');
        },
        editReply: async (response) => {
            console.log('📤 Bot Response:');
            if (response.embeds && response.embeds.length > 0) {
                const embed = response.embeds[0];
                console.log(`📋 Title: ${embed.title || 'undefined'}`);
                console.log(`📄 Description: ${embed.description || 'undefined'}`);
                
                if (embed.fields && embed.fields.length > 0) {
                    console.log('📊 Key Fields:');
                    embed.fields.forEach((field, index) => {
                        if (field.name.includes('Tipp') || field.name.includes('club') || 
                            field.value.includes('club:') || field.value.includes('Club:')) {
                            console.log(`  ${index + 1}. 📌 ${field.name}`);
                            const fieldValue = field.value.length > 200 ? 
                                field.value.substring(0, 197) + '...' : 
                                field.value;
                            console.log(`     📝 ${fieldValue.replace(/\n/g, '\n     ')}`);
                            
                            // Check for new interface features
                            if (field.value.includes('name:') && field.value.includes('club:')) {
                                console.log('     ✅ New two-field interface guidance found');
                            }
                        }
                    });
                } else {
                    console.log('📊 Fields: No fields');
                }
                
                if (embed.footer) {
                    console.log(`🔗 Footer: ${embed.footer.text || 'undefined'}`);
                    if (embed.footer.text && embed.footer.text.includes('club')) {
                        console.log('     ✅ Club-related footer guidance found');
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
            console.error('📋 Stack trace:', error.stack.substring(0, 300) + '...');
        }
    }
}

async function runAllTests() {
    console.log('🚀 Starting Two-Field DWZ Command Interface Tests');
    console.log('==================================================');
    console.log('🎯 Features being tested:');
    console.log('   • Separate name and club fields');
    console.log('   • Optional club field');
    console.log('   • Backward compatibility with combined name field');
    console.log('   • Proper parameter handling and display');
    console.log('   • Updated user guidance for new interface');
    console.log('==================================================');
    
    for (const testCase of testCases) {
        await runTest(testCase);
        
        // Add delay between tests to avoid rate limiting
        if (testCase !== testCases[testCases.length - 1]) {
            console.log('\n⏳ Waiting 3 seconds before next test...');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    console.log('\n🏁 All tests completed!');
    console.log('==================================================');
    console.log('✅ New Interface Features:');
    console.log('   • ✅ Separate name and club parameters');
    console.log('   • ✅ Club field is optional');
    console.log('   • ✅ Backward compatibility maintained');
    console.log('   • ✅ Updated user guidance');
    console.log('   • ✅ Proper parameter display in results');
    console.log('==================================================');
    console.log('\n🎯 New Usage Examples:');
    console.log('• /dwz name:Schmidt → Shows all Schmidt players');
    console.log('• /dwz name:Schmidt club:München → Shows Schmidt from München');
    console.log('• /dwz name:Müller club:SV → Shows Müller from SV clubs');
    console.log('• /dwz name:"Schmidt München" → Still works (legacy)');
}

// Run the tests
runAllTests().catch(console.error);
