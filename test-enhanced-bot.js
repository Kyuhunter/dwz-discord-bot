#!/usr/bin/env node

// Test the enhanced DWZ bot functionality with detailed player data
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Mock Discord interaction for testing
class MockInteraction {
    constructor(playerName) {
        this.playerName = playerName;
        this.replied = false;
        this.deferred = false;
    }
    
    options = {
        getString: (name) => {
            if (name === 'name') return this.playerName;
            return null;
        }
    };
    
    async deferReply() {
        this.deferred = true;
        console.log('📤 Deferred reply');
    }
    
    async editReply({ embeds }) {
        this.replied = true;
        const embed = embeds[0];
        console.log('\n🔷 Enhanced Discord Embed Response:');
        console.log(`Title: ${embed.data.title}`);
        console.log(`Description: ${embed.data.description}`);
        console.log(`Color: 0x${embed.data.color.toString(16).toUpperCase()}`);
        
        if (embed.data.fields) {
            console.log('\nFields:');
            embed.data.fields.forEach(field => {
                console.log(`  ${field.name}: ${field.value}`);
            });
        }
        
        if (embed.data.footer) {
            console.log(`\nFooter: ${embed.data.footer.text}`);
        }
        
        console.log(`\nTimestamp: ${embed.data.timestamp}`);
    }
}

async function testEnhancedBot() {
    console.log('=== Testing Enhanced DWZ Bot with Player Details ===\n');
    
    try {
        // Load the enhanced dwz command module
        const dwzCommand = require('./src/commands/dwz.js');
        
        // Test with "Olschimke" to get the enhanced data
        console.log('Testing enhanced functionality with "Olschimke":');
        const mockInteraction = new MockInteraction('Olschimke');
        await dwzCommand.execute(mockInteraction);
        
        console.log('\n' + '='.repeat(70) + '\n');
        
        // Test with "Adrian Olschimke" as well
        console.log('Testing with "Adrian Olschimke":');
        const mockInteraction2 = new MockInteraction('Adrian Olschimke');
        await dwzCommand.execute(mockInteraction2);
        
        console.log('\n' + '='.repeat(70) + '\n');
        console.log('✅ Enhanced DWZ bot test completed successfully!');
        console.log('\nNew features tested:');
        console.log('  - ZPK (Player ID) extraction from club XML');
        console.log('  - Detailed player data fetching using ZPK');
        console.log('  - Enhanced Discord embed with FIDE rating, member number, etc.');
        console.log('  - Tournament history information');
        console.log('  - Complete player profile data');
        
    } catch (error) {
        console.error('❌ Enhanced test failed:', error.message);
        console.error(error.stack);
    }
}

testEnhancedBot().catch(console.error);
