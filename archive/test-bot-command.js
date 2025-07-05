#!/usr/bin/env node

// Simple test to verify the bot command works
const fs = require('fs');
const path = require('path');

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
        console.log('\n🔷 Discord Embed Response:');
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
    }
}

async function testBotCommand() {
    console.log('=== Testing Discord Bot DWZ Command ===\n');
    
    try {
        // Load the dwz command module
        const dwzCommand = require('./src/commands/dwz.js');
        
        // Test with "Olschimke"
        console.log('Testing with "Olschimke":');
        const mockInteraction = new MockInteraction('Olschimke');
        await dwzCommand.execute(mockInteraction);
        
        console.log('\n' + '='.repeat(50) + '\n');
        
        // Test with "Adrian Olschimke"
        console.log('Testing with "Adrian Olschimke":');
        const mockInteraction2 = new MockInteraction('Adrian Olschimke');
        await dwzCommand.execute(mockInteraction2);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

testBotCommand().catch(console.error);
