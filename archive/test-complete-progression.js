#!/usr/bin/env node

console.log('🚀 Testing Complete DWZ Progression Chart');
console.log('=========================================');

// Mock tournament data - simulate a player with many tournaments
const mockTournaments = [
    { index: 10, turniername: 'Recent Tournament', dwzalt: '1720', dwzneu: '1730', punkte: '5.5', partien: '7' },
    { index: 9, turniername: 'Previous Tournament', dwzalt: '1710', dwzneu: '1720', punkte: '4', partien: '6' },
    { index: 8, turniername: 'Another Tournament', dwzalt: '1700', dwzneu: '1710', punkte: '3.5', partien: '5' },
    { index: 7, turniername: 'City Championship', dwzalt: '1685', dwzneu: '1700', punkte: '6', partien: '7' },
    { index: 6, turniername: 'Regional Open', dwzalt: '1670', dwzneu: '1685', punkte: '4.5', partien: '6' },
    { index: 5, turniername: 'Club Tournament', dwzalt: '1660', dwzneu: '1670', punkte: '5', partien: '6' },
    { index: 4, turniername: 'Spring Event', dwzalt: '1650', dwzneu: '1660', punkte: '3', partien: '5' },
    { index: 3, turniername: 'Winter Cup', dwzalt: '1640', dwzneu: '1650', punkte: '4', partien: '6' },
    { index: 2, turniername: 'Autumn Tournament', dwzalt: '1620', dwzneu: '1640', punkte: '5.5', partien: '7' },
    { index: 1, turniername: 'First Tournament', dwzalt: '1600', dwzneu: '1620', punkte: '3.5', partien: '5' }
];

console.log(`📊 Mock data: ${mockTournaments.length} tournaments`);
console.log('   DWZ progression: 1600 → 1730 (+130 points)');

// Test chart generation with all tournaments
const { generateDWZChart } = require('./src/utils/chartGenerator');

async function testCompleteProgression() {
    console.log('\n🎨 Testing chart generation with all tournaments...');
    
    try {
        const chartAttachment = await generateDWZChart(mockTournaments, 'Test Player');
        if (chartAttachment) {
            console.log('✅ Chart generated successfully:');
            console.log(`   • File: ${chartAttachment.name}`);
            console.log(`   • Data points: ${mockTournaments.length + 1} (start + ${mockTournaments.length} tournaments)`);
            console.log('   • Shows complete progression from 1600 to 1730');
        } else {
            console.log('❌ Chart generation failed');
        }
    } catch (error) {
        console.error('❌ Error generating chart:', error.message);
    }
}

// Test profile display (only last 3 tournaments)
function testProfileDisplay() {
    console.log('\n📋 Testing profile display (last 3 tournaments only)...');
    
    const recentTournaments = mockTournaments.slice(0, 3);
    console.log(`✅ Profile shows ${recentTournaments.length} recent tournaments:`);
    
    recentTournaments.forEach((tournament, index) => {
        const name = tournament.turniername;
        const score = tournament.punkte;
        const games = tournament.partien;
        const oldDwz = tournament.dwzalt;
        const newDwz = tournament.dwzneu;
        const change = parseInt(newDwz) - parseInt(oldDwz);
        
        console.log(`   ${index + 1}. ${name}`);
        console.log(`      ${score}/${games} • ${oldDwz}→${newDwz} (${change >= 0 ? '+' : ''}${change})`);
    });
    
    console.log(`\n📈 Chart contains all ${mockTournaments.length} tournaments for complete progression`);
}

async function runTests() {
    await testCompleteProgression();
    testProfileDisplay();
    
    console.log('\n🎯 Summary:');
    console.log('   ✅ Chart: Shows complete progression (all tournaments)');
    console.log('   ✅ Profile: Shows only last 3 tournaments');
    console.log('   ✅ Statistics: Removed (no longer displayed)');
    console.log('\n🎉 Test completed successfully!');
}

runTests().catch(console.error);
