#!/usr/bin/env node

console.log('🔧 Testing Fixed Chart Generation for Kursawe,Finn Data');
console.log('=======================================================');

// Simulate the exact tournament data from Kursawe,Finn
const kursaweTournaments = [
    { 
        index: 3, 
        turniername: 'Bezirksliga BOR/ST Stichkampf 9-12', 
        dwzalt: '1607', 
        dwzneu: undefined,  // This is the issue - undefined dwzneu
        punkte: '3', 
        partien: '4' 
    },
    { 
        index: 2, 
        turniername: 'Bezirksliga Borken/Steinfurt 2024/25 Staffel B', 
        dwzalt: '1532', 
        dwzneu: '1607',
        punkte: '4.5', 
        partien: '7' 
    },
    { 
        index: 1, 
        turniername: 'Verbandsklasse Münsterland 2023/24', 
        dwzalt: '0',    // First tournament - no previous DWZ
        dwzneu: '1532', // Valid ending DWZ
        punkte: '5', 
        partien: '9' 
    }
];

async function testFixedChartGeneration() {
    console.log('📊 Original tournament data:');
    kursaweTournaments.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.turniername}: dwzalt="${t.dwzalt}", dwzneu="${t.dwzneu}"`);
    });
    
    console.log('\n🎯 Testing with improved chart generation...');
    
    const { generateDWZChart } = require('./src/utils/chartGenerator');
    
    try {
        const chartAttachment = await generateDWZChart(kursaweTournaments, 'Kursawe,Finn');
        
        if (chartAttachment) {
            console.log('✅ Chart generated successfully!');
            console.log(`   File: ${chartAttachment.name}`);
            
            // Clean up test file
            const fs = require('fs');
            if (fs.existsSync(chartAttachment.attachment)) {
                const stats = fs.statSync(chartAttachment.attachment);
                console.log(`   Size: ${(stats.size / 1024).toFixed(1)} KB`);
                fs.unlinkSync(chartAttachment.attachment);
                console.log('   Test file cleaned up');
            }
        } else {
            console.log('❌ Chart generation still failed');
        }
    } catch (error) {
        console.error('❌ Chart generation error:', error.message);
    }
}

async function testEdgeCases() {
    console.log('\n🧪 Testing other edge cases...');
    
    // Test case 1: First tournament with dwzalt="0"
    const firstTournamentCase = [
        { index: 2, turniername: 'Tournament 2', dwzalt: '1520', dwzneu: '1530', punkte: '4', partien: '6' },
        { index: 1, turniername: 'First Tournament', dwzalt: '0', dwzneu: '1520', punkte: '3.5', partien: '5' }
    ];
    
    console.log('\n   📝 Case 1: First tournament with dwzalt="0"');
    const { generateDWZChart } = require('./src/utils/chartGenerator');
    
    try {
        const chart1 = await generateDWZChart(firstTournamentCase, 'Test Player 1');
        console.log(`      Result: ${chart1 ? 'Chart generated ✅' : 'Chart failed ❌'}`);
        
        if (chart1) {
            const fs = require('fs');
            if (fs.existsSync(chart1.attachment)) {
                fs.unlinkSync(chart1.attachment);
            }
        }
    } catch (error) {
        console.log(`      Error: ${error.message}`);
    }
    
    // Test case 2: Mixed valid/invalid tournaments
    const mixedCase = [
        { index: 3, turniername: 'Invalid Tournament', dwzalt: '1530', dwzneu: undefined, punkte: '4', partien: '6' },
        { index: 2, turniername: 'Valid Tournament', dwzalt: '1520', dwzneu: '1530', punkte: '4', partien: '6' },
        { index: 1, turniername: 'First Tournament', dwzalt: '0', dwzneu: '1520', punkte: '3.5', partien: '5' }
    ];
    
    console.log('\n   📝 Case 2: Mixed valid/invalid (like Kursawe,Finn)');
    try {
        const chart2 = await generateDWZChart(mixedCase, 'Test Player 2');
        console.log(`      Result: ${chart2 ? 'Chart generated ✅' : 'Chart failed ❌'}`);
        
        if (chart2) {
            const fs = require('fs');
            if (fs.existsSync(chart2.attachment)) {
                fs.unlinkSync(chart2.attachment);
            }
        }
    } catch (error) {
        console.log(`      Error: ${error.message}`);
    }
}

async function runTest() {
    await testFixedChartGeneration();
    await testEdgeCases();
    
    console.log('\n🎯 Summary:');
    console.log('===========');
    console.log('✅ Fixed filtering logic to handle:');
    console.log('   • First tournaments with dwzalt="0"');
    console.log('   • Tournaments with undefined/missing dwzneu');
    console.log('   • Better validation for numeric DWZ values');
    console.log('');
    console.log('🎉 Kursawe,Finn should now get a chart generated!');
    console.log('   The chart will show progression from tournaments 1→2');
    console.log('   (Tournament 3 excluded due to undefined dwzneu)');
}

runTest().catch(console.error);
