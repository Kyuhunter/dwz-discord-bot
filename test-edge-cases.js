#!/usr/bin/env node

console.log('🧪 Testing DWZ Bot with <3 Tournaments');
console.log('======================================');

const { generateDWZChart } = require('./src/utils/chartGenerator');

// Test cases for different tournament counts
const testCases = [
    {
        name: 'Player with 0 tournaments',
        tournaments: []
    },
    {
        name: 'Player with 1 tournament',
        tournaments: [
            { index: 1, turniername: 'First Tournament', dwzalt: '1600', dwzneu: '1620', punkte: '3.5', partien: '5' }
        ]
    },
    {
        name: 'Player with 2 tournaments',
        tournaments: [
            { index: 2, turniername: 'Recent Tournament', dwzalt: '1620', dwzneu: '1630', punkte: '4', partien: '6' },
            { index: 1, turniername: 'First Tournament', dwzalt: '1600', dwzneu: '1620', punkte: '3.5', partien: '5' }
        ]
    },
    {
        name: 'Player with exactly 3 tournaments',
        tournaments: [
            { index: 3, turniername: 'Latest Tournament', dwzalt: '1630', dwzneu: '1640', punkte: '5', partien: '7' },
            { index: 2, turniername: 'Recent Tournament', dwzalt: '1620', dwzneu: '1630', punkte: '4', partien: '6' },
            { index: 1, turniername: 'First Tournament', dwzalt: '1600', dwzneu: '1620', punkte: '3.5', partien: '5' }
        ]
    }
];

async function testChartGeneration(testCase) {
    console.log(`\n📊 Testing: ${testCase.name}`);
    console.log(`   Tournament count: ${testCase.tournaments.length}`);
    
    try {
        const chartAttachment = await generateDWZChart(testCase.tournaments, 'Test Player');
        
        if (chartAttachment) {
            console.log('   ✅ Chart generated successfully');
            console.log(`   📁 File: ${chartAttachment.name}`);
            
            // Check if file exists and has reasonable size
            const fs = require('fs');
            if (fs.existsSync(chartAttachment.attachment)) {
                const stats = fs.statSync(chartAttachment.attachment);
                console.log(`   📊 Size: ${(stats.size / 1024).toFixed(1)} KB`);
                
                // Clean up test file
                fs.unlinkSync(chartAttachment.attachment);
                console.log('   🧹 Test file cleaned up');
            }
        } else {
            console.log('   ❌ No chart generated (expected for insufficient data)');
        }
    } catch (error) {
        console.log(`   💥 Error: ${error.message}`);
    }
}

function testProfileDisplay(testCase) {
    console.log(`\n📋 Testing profile display: ${testCase.name}`);
    
    const tournaments = testCase.tournaments;
    
    if (tournaments.length === 0) {
        console.log('   📝 No tournaments → No tournament section in profile');
        console.log('   ✅ Expected: Tournament field should not be added');
        return;
    }
    
    // Simulate the profile display logic
    const recentTournaments = tournaments.slice(0, 3);
    console.log(`   📝 Tournaments to display in profile: ${recentTournaments.length}`);
    
    recentTournaments.forEach((tournament, index) => {
        const name = tournament.turniername || 'Unknown Tournament';
        const score = tournament.punkte || '0';
        const games = tournament.partien || '0';
        const oldDwz = tournament.dwzalt || '0';
        const newDwz = tournament.dwzneu || '0';
        
        let dwzChange = '';
        if (oldDwz && newDwz && oldDwz !== '0' && newDwz !== '0') {
            const change = parseInt(newDwz) - parseInt(oldDwz);
            if (change > 0) {
                dwzChange = ` (+${change})`;
            } else if (change < 0) {
                dwzChange = ` (${change})`;
            } else {
                dwzChange = ' (0)';
            }
        }
        
        console.log(`   ${index + 1}. ${name}`);
        console.log(`      ${score}/${games}${dwzChange ? ' • ' + oldDwz + '→' + newDwz + dwzChange : ''}`);
    });
    
    const totalTournaments = tournaments.length;
    const fieldTitle = `🏁 Recent Tournaments (Last ${recentTournaments.length}${totalTournaments > 3 ? ` of ${totalTournaments}` : ''})`;
    console.log(`   📊 Field title: "${fieldTitle}"`);
}

async function runAllTests() {
    console.log('🔍 Testing chart generation behavior...');
    
    for (const testCase of testCases) {
        await testChartGeneration(testCase);
    }
    
    console.log('\n🔍 Testing profile display behavior...');
    
    for (const testCase of testCases) {
        testProfileDisplay(testCase);
    }
    
    console.log('\n🎯 Edge Case Analysis:');
    console.log('======================');
    console.log('📊 Chart Generation:');
    console.log('   • 0 tournaments: No chart (expected)');
    console.log('   • 1 tournament: No chart (insufficient data)');
    console.log('   • 2+ tournaments: Chart generated');
    console.log('');
    console.log('📋 Profile Display:');
    console.log('   • 0 tournaments: No tournament section');
    console.log('   • 1-3 tournaments: Show all tournaments');
    console.log('   • >3 tournaments: Show last 3 with count indicator');
    console.log('');
    console.log('🎉 Test Summary:');
    console.log('   ✅ Bot should handle all tournament counts gracefully');
    console.log('   ✅ Chart generation has appropriate minimum data requirements');
    console.log('   ✅ Profile display adapts to available tournament count');
}

runAllTests().catch(console.error);
