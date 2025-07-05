#!/usr/bin/env node

console.log('🔍 Simulating Chart Generation Issues with 3 Tournaments');
console.log('========================================================');

const { generateDWZChart } = require('./src/utils/chartGenerator');

// Simulate different problematic tournament data patterns that might occur with real players
const problematicScenarios = [
    {
        name: 'Scenario 1: All tournaments have empty DWZ strings',
        tournaments: [
            { index: 3, turniername: 'Tournament 3', dwzalt: '', dwzneu: '', punkte: '5', partien: '7' },
            { index: 2, turniername: 'Tournament 2', dwzalt: '', dwzneu: '', punkte: '4', partien: '6' },
            { index: 1, turniername: 'Tournament 1', dwzalt: '', dwzneu: '', punkte: '3.5', partien: '5' }
        ]
    },
    {
        name: 'Scenario 2: All tournaments have zero DWZ values',
        tournaments: [
            { index: 3, turniername: 'Tournament 3', dwzalt: '0', dwzneu: '0', punkte: '5', partien: '7' },
            { index: 2, turniername: 'Tournament 2', dwzalt: '0', dwzneu: '0', punkte: '4', partien: '6' },
            { index: 1, turniername: 'Tournament 1', dwzalt: '0', dwzneu: '0', punkte: '3.5', partien: '5' }
        ]
    },
    {
        name: 'Scenario 3: Missing DWZ fields entirely',
        tournaments: [
            { index: 3, turniername: 'Tournament 3', punkte: '5', partien: '7' },
            { index: 2, turniername: 'Tournament 2', punkte: '4', partien: '6' },
            { index: 1, turniername: 'Tournament 1', punkte: '3.5', partien: '5' }
        ]
    },
    {
        name: 'Scenario 4: Only one valid tournament out of 3',
        tournaments: [
            { index: 3, turniername: 'Tournament 3', dwzalt: '', dwzneu: '', punkte: '5', partien: '7' },
            { index: 2, turniername: 'Tournament 2', dwzalt: '0', dwzneu: '0', punkte: '4', partien: '6' },
            { index: 1, turniername: 'Tournament 1', dwzalt: '1650', dwzneu: '1660', punkte: '3.5', partien: '5' }
        ]
    },
    {
        name: 'Scenario 5: Mixed valid/invalid with special cases',
        tournaments: [
            { index: 3, turniername: 'Tournament 3', dwzalt: 'null', dwzneu: 'null', punkte: '5', partien: '7' },
            { index: 2, turniername: 'Tournament 2', dwzalt: undefined, dwzneu: undefined, punkte: '4', partien: '6' },
            { index: 1, turniername: 'Tournament 1', dwzalt: '1650', dwzneu: '1660', punkte: '3.5', partien: '5' }
        ]
    },
    {
        name: 'Scenario 6: Non-numeric DWZ values',
        tournaments: [
            { index: 3, turniername: 'Tournament 3', dwzalt: 'N/A', dwzneu: 'N/A', punkte: '5', partien: '7' },
            { index: 2, turniername: 'Tournament 2', dwzalt: '-', dwzneu: '-', punkte: '4', partien: '6' },
            { index: 1, turniername: 'Tournament 1', dwzalt: '1650', dwzneu: '1660', punkte: '3.5', partien: '5' }
        ]
    }
];

async function testScenario(scenario) {
    console.log(`\n🧪 ${scenario.name}:`);
    console.log('─'.repeat(50));
    
    try {
        const chartAttachment = await generateDWZChart(scenario.tournaments, 'Test Player');
        
        if (chartAttachment) {
            console.log('   ✅ Chart generated (unexpected for problematic scenarios)');
            
            const fs = require('fs');
            if (fs.existsSync(chartAttachment.attachment)) {
                fs.unlinkSync(chartAttachment.attachment);
            }
        } else {
            console.log('   ❌ Chart not generated (expected for problematic scenarios)');
        }
    } catch (error) {
        console.log(`   💥 Error during chart generation: ${error.message}`);
    }
}

async function testValidScenario() {
    console.log('\n✅ Control Test: Valid 3-tournament scenario:');
    console.log('─'.repeat(50));
    
    const validTournaments = [
        { index: 3, turniername: 'Valid Tournament 3', dwzalt: '1670', dwzneu: '1680', punkte: '5', partien: '7' },
        { index: 2, turniername: 'Valid Tournament 2', dwzalt: '1660', dwzneu: '1670', punkte: '4', partien: '6' },
        { index: 1, turniername: 'Valid Tournament 1', dwzalt: '1650', dwzneu: '1660', punkte: '3.5', partien: '5' }
    ];
    
    try {
        const chartAttachment = await generateDWZChart(validTournaments, 'Valid Test Player');
        
        if (chartAttachment) {
            console.log('   ✅ Chart generated successfully (expected)');
            
            const fs = require('fs');
            if (fs.existsSync(chartAttachment.attachment)) {
                const stats = fs.statSync(chartAttachment.attachment);
                console.log(`   📊 Chart size: ${(stats.size / 1024).toFixed(1)} KB`);
                fs.unlinkSync(chartAttachment.attachment);
                console.log('   🧹 Test file cleaned up');
            }
        } else {
            console.log('   ❌ Chart not generated (unexpected!)');
        }
    } catch (error) {
        console.log(`   💥 Error during chart generation: ${error.message}`);
    }
}

async function runAllTests() {
    console.log('🎯 Testing various problematic tournament data scenarios...');
    
    await testValidScenario();
    
    for (const scenario of problematicScenarios) {
        await testScenario(scenario);
    }
    
    console.log('\n🎯 Analysis and Recommendations:');
    console.log('=================================');
    console.log('If "Finn Kursawe" has 3 tournaments but no chart is generated,');
    console.log('the most likely causes are:');
    console.log('');
    console.log('1. 🔍 Empty DWZ values (dwzalt="", dwzneu="")');
    console.log('2. 🔍 Zero DWZ values (dwzalt="0", dwzneu="0")');
    console.log('3. 🔍 Missing DWZ fields entirely');
    console.log('4. 🔍 Non-numeric DWZ values ("N/A", "-", etc.)');
    console.log('5. 🔍 Only one valid tournament (need minimum 2)');
    console.log('');
    console.log('💡 Solution: The debug logging added to the chart generator');
    console.log('   will show exactly which scenario is occurring when you');
    console.log('   search for "Finn Kursawe" using the Discord bot.');
    console.log('');
    console.log('🔧 To get specific debug info for "Finn Kursawe":');
    console.log('   1. Use the Discord bot: /dwz name:Finn club:Kursawe');
    console.log('   2. Or: /dwz name:"Finn Kursawe"');
    console.log('   3. Check the console output for the debug logs');
    console.log('   4. The logs will show the actual DWZ values from the API');
}

runAllTests().catch(console.error);
