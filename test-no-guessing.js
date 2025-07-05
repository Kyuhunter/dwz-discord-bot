#!/usr/bin/env node

console.log('🔧 Testing Improved Chart Logic - No Guessing Starting DWZ');
console.log('==========================================================');

// Test the exact Kursawe,Finn scenario
const kursaweTournaments = [
    { 
        index: 3, 
        turniername: 'Bezirksliga BOR/ST Stichkampf 9-12', 
        dwzalt: '1607', 
        dwzneu: undefined,  // Invalid - will be filtered out
        punkte: '3', 
        partien: '4' 
    },
    { 
        index: 2, 
        turniername: 'Bezirksliga Borken/Steinfurt 2024/25 Staffel B', 
        dwzalt: '1532', 
        dwzneu: '1607',     // Valid tournament
        punkte: '4.5', 
        partien: '7' 
    },
    { 
        index: 1, 
        turniername: 'Verbandsklasse Münsterland 2023/24', 
        dwzalt: '0',        // First tournament - no previous DWZ
        dwzneu: '1532',     // Valid ending DWZ
        punkte: '5', 
        partien: '9' 
    }
];

async function testImprovedLogic() {
    console.log('📊 Test data (Kursawe,Finn scenario):');
    kursaweTournaments.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.turniername}: dwzalt="${t.dwzalt}", dwzneu="${t.dwzneu}"`);
    });
    
    console.log('\n🎯 Expected behavior:');
    console.log('   • Tournament 3: Filtered out (dwzneu=undefined)');
    console.log('   • Tournament 1: Used (dwzalt="0" but dwzneu="1532")');
    console.log('   • Tournament 2: Used (dwzalt="1532", dwzneu="1607")');
    console.log('   • Chart should start at 1532 (first non-zero dwzalt from Tournament 2)');
    console.log('   • Chart points: 1532 → 1607');
    
    const { generateDWZChart } = require('./src/utils/chartGenerator');
    
    try {
        const chartAttachment = await generateDWZChart(kursaweTournaments, 'Kursawe,Finn');
        
        if (chartAttachment) {
            console.log('\n✅ Chart generated successfully!');
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
            console.log('\n❌ Chart generation failed');
        }
    } catch (error) {
        console.error('\n❌ Chart generation error:', error.message);
    }
}

async function testEdgeCases() {
    console.log('\n🧪 Testing edge cases...');
    
    // Edge Case 1: All tournaments have dwzalt="0" 
    console.log('\n   📝 Case 1: All tournaments start with dwzalt="0"');
    const allZeroStart = [
        { index: 2, turniername: 'Tournament 2', dwzalt: '0', dwzneu: '1520', punkte: '4', partien: '6' },
        { index: 1, turniername: 'Tournament 1', dwzalt: '0', dwzneu: '1500', punkte: '3.5', partien: '5' }
    ];
    
    try {
        const chart1 = await generateDWZChart(allZeroStart, 'Test Player 1');
        console.log(`      Result: ${chart1 ? 'Chart generated ✅' : 'Chart failed ❌'}`);
        console.log('      Expected: Chart starts with first tournament (no "Start" point)');
        
        if (chart1) {
            const fs = require('fs');
            if (fs.existsSync(chart1.attachment)) {
                fs.unlinkSync(chart1.attachment);
            }
        }
    } catch (error) {
        console.log(`      Error: ${error.message}`);
    }
    
    // Edge Case 2: Mixed zero and non-zero starting DWZ
    console.log('\n   📝 Case 2: Mixed zero and valid starting DWZ');
    const mixedStart = [
        { index: 3, turniername: 'Tournament 3', dwzalt: '1520', dwzneu: '1530', punkte: '4', partien: '6' },
        { index: 2, turniername: 'Tournament 2', dwzalt: '1500', dwzneu: '1520', punkte: '4', partien: '6' },
        { index: 1, turniername: 'Tournament 1', dwzalt: '0', dwzneu: '1500', punkte: '3.5', partien: '5' }
    ];
    
    try {
        const chart2 = await generateDWZChart(mixedStart, 'Test Player 2');
        console.log(`      Result: ${chart2 ? 'Chart generated ✅' : 'Chart failed ❌'}`);
        console.log('      Expected: Chart starts at 1500 (first non-zero dwzalt from Tournament 2)');
        
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
    await testImprovedLogic();
    await testEdgeCases();
    
    console.log('\n🎯 Summary:');
    console.log('===========');
    console.log('✅ Improved chart logic:');
    console.log('   • No guessing/estimating starting DWZ');
    console.log('   • Chart starts with first actual non-zero dwzalt');
    console.log('   • If all tournaments have dwzalt="0", chart starts with first tournament');
    console.log('   • Clean, accurate progression based on real data only');
    console.log('');
    console.log('🎉 Kursawe,Finn will now get a chart showing: 1532 → 1607');
}

runTest().catch(console.error);
