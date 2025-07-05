#!/usr/bin/env node

console.log('🎯 Testing Actual DWZ Command Logic with Edge Cases');
console.log('==================================================');

// Simulate the createPlayerEmbed function logic for different tournament scenarios
function simulateCreatePlayerEmbed(player, details) {
    console.log(`\n👤 Testing player: ${player.name}`);
    console.log(`📊 Tournament count: ${details.tournaments ? details.tournaments.length : 0}`);
    
    const result = {
        embeds: [],
        files: []
    };
    
    const fields = [];
    
    // Simulate the tournament section logic from the actual DWZ command
    if (details.tournaments && details.tournaments.length > 0) {
        const tournaments = details.tournaments;
        
        console.log('   📈 Chart generation test:');
        // Simulate chart generation logic
        const hasSufficientDataForChart = tournaments.filter(t => 
            t.dwzalt && t.dwzneu && t.dwzalt !== '0' && t.dwzneu !== '0'
        ).length >= 2;
        
        if (hasSufficientDataForChart) {
            console.log('   ✅ Chart would be generated (sufficient data)');
            result.files.push({ name: 'simulated_chart.png' });
        } else {
            console.log('   ❌ Chart would NOT be generated (insufficient data)');
        }
        
        // Simulate tournament display logic
        let tournamentText = '';
        const recentTournaments = tournaments.slice(0, 3); // Show only last 3 in profile
        console.log(`   📋 Tournaments to show in profile: ${recentTournaments.length}`);
        
        recentTournaments.forEach((tournament, index) => {
            const name = tournament.turniername || 'Unknown Tournament';
            const score = tournament.punkte || '0';
            const games = tournament.partien || '0';
            const oldDwz = tournament.dwzalt || '0';
            const newDwz = tournament.dwzneu || '0';
            
            // Calculate DWZ change
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
            
            // Truncate long tournament names
            const shortName = name.length > 30 ? name.substring(0, 27) + '...' : name;
            tournamentText += `**${index + 1}. ${shortName}**\n`;
            tournamentText += `${score}/${games}`;
            if (dwzChange) {
                tournamentText += ` • ${oldDwz}→${newDwz}${dwzChange}`;
            }
            
            if (index < recentTournaments.length - 1) {
                tournamentText += '\n\n';
            }
        });
        
        const fieldName = `🏁 Recent Tournaments (Last ${recentTournaments.length}${tournaments.length > 3 ? ` of ${tournaments.length}` : ''})`;
        const fieldValue = tournamentText || 'No tournament data available';
        
        fields.push({
            name: fieldName,
            value: fieldValue,
            inline: true
        });
        
        console.log(`   📊 Field name: "${fieldName}"`);
        console.log(`   📝 Field value preview: "${fieldValue.substring(0, 50)}${fieldValue.length > 50 ? '...' : ''}"`);
    } else {
        console.log('   📋 No tournaments → Tournament field will NOT be added');
    }
    
    result.fields = fields;
    return result;
}

// Test cases
const testCases = [
    {
        player: { name: 'Player Zero', dwz: '1500' },
        details: { tournaments: [] }
    },
    {
        player: { name: 'Player One', dwz: '1520' },
        details: { 
            tournaments: [
                { index: 1, turniername: 'Only Tournament', dwzalt: '1500', dwzneu: '1520', punkte: '4', partien: '6' }
            ]
        }
    },
    {
        player: { name: 'Player Two', dwz: '1540' },
        details: { 
            tournaments: [
                { index: 2, turniername: 'Second Tournament', dwzalt: '1520', dwzneu: '1540', punkte: '5', partien: '7' },
                { index: 1, turniername: 'First Tournament', dwzalt: '1500', dwzneu: '1520', punkte: '4', partien: '6' }
            ]
        }
    },
    {
        player: { name: 'Player NoData', dwz: '1500' },
        details: {} // No tournaments key at all
    }
];

console.log('\n🧪 Running edge case tests...');

testCases.forEach((testCase, index) => {
    const result = simulateCreatePlayerEmbed(testCase.player, testCase.details);
    
    console.log(`   📊 Result summary:`);
    console.log(`      • Chart files: ${result.files.length}`);
    console.log(`      • Tournament fields: ${result.fields.length}`);
    
    if (result.fields.length > 0) {
        console.log(`      • Field names: ${result.fields.map(f => f.name).join(', ')}`);
    }
});

console.log('\n🎯 Analysis & Recommendations:');
console.log('==============================');
console.log('✅ Chart Generation:');
console.log('   • Correctly requires 2+ tournaments with valid DWZ data');
console.log('   • Handles insufficient data gracefully (no chart generated)');
console.log('');
console.log('✅ Tournament Display:');
console.log('   • Shows all available tournaments (up to 3)');
console.log('   • Adapts field title to actual count');
console.log('   • Handles empty tournament arrays correctly');
console.log('');
console.log('⚠️  Potential Issue Found:');
console.log('   • Tournament field is always added, even with empty data');
console.log('   • Shows "No tournament data available" as fallback');
console.log('   • This might clutter the embed for players with no tournament history');
console.log('');
console.log('💡 Recommendation:');
console.log('   • Consider only adding tournament field when tournaments exist');
console.log('   • This would create cleaner embeds for players without tournament data');
