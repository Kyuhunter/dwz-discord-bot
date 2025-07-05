#!/usr/bin/env node

console.log('🔍 Debugging: Chart Generation for 3 Tournaments');
console.log('=================================================');

const { generateDWZChart } = require('./src/utils/chartGenerator');

// Test case: Exactly 3 tournaments with valid DWZ data
const threeTournaments = [
    { index: 3, turniername: 'Latest Tournament', dwzalt: '1630', dwzneu: '1640', punkte: '5', partien: '7' },
    { index: 2, turniername: 'Middle Tournament', dwzalt: '1620', dwzneu: '1630', punkte: '4', partien: '6' },
    { index: 1, turniername: 'First Tournament', dwzalt: '1600', dwzneu: '1620', punkte: '3.5', partien: '5' }
];

console.log('📊 Test Data:');
console.log(`   Tournament count: ${threeTournaments.length}`);
threeTournaments.forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.turniername}: ${t.dwzalt} → ${t.dwzneu}`);
});

async function debugChartGeneration() {
    console.log('\n🔬 Step-by-step chart generation debug:');
    
    // Step 1: Filter tournaments for valid DWZ data
    const validTournaments = threeTournaments.filter(t => 
        t.dwzalt && t.dwzneu && t.dwzalt !== '0' && t.dwzneu !== '0'
    );
    console.log(`   ✅ Valid tournaments after filtering: ${validTournaments.length}`);
    validTournaments.forEach((t, i) => {
        console.log(`      ${i + 1}. ${t.turniername}: dwzalt="${t.dwzalt}", dwzneu="${t.dwzneu}"`);
    });
    
    // Step 2: Check minimum requirement
    const meetsMinimum = validTournaments.length >= 2;
    console.log(`   📏 Meets minimum requirement (≥2): ${meetsMinimum}`);
    
    if (!meetsMinimum) {
        console.log('   ❌ Chart generation will fail - insufficient valid tournaments');
        return;
    }
    
    // Step 3: Sort tournaments by index
    const sortedTournaments = validTournaments.sort((a, b) => a.index - b.index);
    console.log(`   📈 Sorted tournaments (oldest first):`);
    sortedTournaments.forEach((t, i) => {
        console.log(`      ${i + 1}. Index ${t.index}: ${t.turniername} (${t.dwzalt} → ${t.dwzneu})`);
    });
    
    // Step 4: Attempt chart generation
    console.log('\n🎨 Attempting chart generation...');
    try {
        const chartAttachment = await generateDWZChart(threeTournaments, 'Test Player');
        
        if (chartAttachment) {
            console.log('   ✅ Chart generated successfully!');
            console.log(`   📁 File: ${chartAttachment.name}`);
            
            // Check file details
            const fs = require('fs');
            if (fs.existsSync(chartAttachment.attachment)) {
                const stats = fs.statSync(chartAttachment.attachment);
                console.log(`   📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
                
                // Clean up
                fs.unlinkSync(chartAttachment.attachment);
                console.log('   🧹 Test file cleaned up');
            }
        } else {
            console.log('   ❌ Chart generation returned null');
        }
    } catch (error) {
        console.log(`   💥 Chart generation error: ${error.message}`);
        console.log(`   📋 Stack trace: ${error.stack}`);
    }
}

// Test with problematic data patterns
async function testProblematicPatterns() {
    console.log('\n🧪 Testing potentially problematic data patterns:');
    
    // Pattern 1: Empty string DWZ values
    const emptyStringTournaments = [
        { index: 3, turniername: 'Tournament 3', dwzalt: '', dwzneu: '', punkte: '5', partien: '7' },
        { index: 2, turniername: 'Tournament 2', dwzalt: '1620', dwzneu: '1630', punkte: '4', partien: '6' },
        { index: 1, turniername: 'Tournament 1', dwzalt: '1600', dwzneu: '1620', punkte: '3.5', partien: '5' }
    ];
    
    console.log('\n   📝 Pattern 1: Mixed empty strings and valid DWZ');
    const validPattern1 = emptyStringTournaments.filter(t => 
        t.dwzalt && t.dwzneu && t.dwzalt !== '0' && t.dwzneu !== '0'
    );
    console.log(`      Valid tournaments: ${validPattern1.length} (should be 2)`);
    
    const chart1 = await generateDWZChart(emptyStringTournaments, 'Test Player 1');
    console.log(`      Chart generated: ${chart1 ? 'Yes' : 'No'}`);
    if (chart1 && require('fs').existsSync(chart1.attachment)) {
        require('fs').unlinkSync(chart1.attachment);
    }
    
    // Pattern 2: Zero DWZ values
    const zeroTournaments = [
        { index: 3, turniername: 'Tournament 3', dwzalt: '0', dwzneu: '0', punkte: '5', partien: '7' },
        { index: 2, turniername: 'Tournament 2', dwzalt: '1620', dwzneu: '1630', punkte: '4', partien: '6' },
        { index: 1, turniername: 'Tournament 1', dwzalt: '1600', dwzneu: '1620', punkte: '3.5', partien: '5' }
    ];
    
    console.log('\n   📝 Pattern 2: Mixed zero and valid DWZ');
    const validPattern2 = zeroTournaments.filter(t => 
        t.dwzalt && t.dwzneu && t.dwzalt !== '0' && t.dwzneu !== '0'
    );
    console.log(`      Valid tournaments: ${validPattern2.length} (should be 2)`);
    
    const chart2 = await generateDWZChart(zeroTournaments, 'Test Player 2');
    console.log(`      Chart generated: ${chart2 ? 'Yes' : 'No'}`);
    if (chart2 && require('fs').existsSync(chart2.attachment)) {
        require('fs').unlinkSync(chart2.attachment);
    }
}

async function runDebugTests() {
    await debugChartGeneration();
    await testProblematicPatterns();
    
    console.log('\n🎯 Diagnosis:');
    console.log('=============');
    console.log('If charts are not generating for 3 tournaments, possible causes:');
    console.log('1. ❓ One or more tournaments have invalid DWZ data');
    console.log('2. ❓ DWZ values are empty strings or zeros');
    console.log('3. ❓ Filtering is removing tournaments unexpectedly');
    console.log('4. ❓ Tournament data structure is different than expected');
    console.log('');
    console.log('💡 Next steps:');
    console.log('• Check actual tournament data from the API');
    console.log('• Verify DWZ field values in real player data');
    console.log('• Add debug logging to the chart generation function');
}

runDebugTests().catch(console.error);
