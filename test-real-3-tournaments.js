#!/usr/bin/env node

console.log('🔍 Testing Real-World 3 Tournament Scenario');
console.log('============================================');

// Simulate what the DWZ command logic does with real data
async function testRealWorldScenario() {
    // Simulate tournament data as it might come from the API
    const mockPlayerDetails = {
        tournaments: [
            // Tournament data as it might appear from the API - sometimes fields are missing or empty
            { 
                index: 3, 
                turniername: 'Vereinsmeisterschaft 2024',
                dwzalt: '1650',
                dwzneu: '1660', 
                punkte: '5.5',
                partien: '7'
            },
            { 
                index: 2, 
                turniername: 'Stadtmeisterschaft',
                dwzalt: '1640',
                dwzneu: '1650', 
                punkte: '4',
                partien: '6'
            },
            { 
                index: 1, 
                turniername: 'Erstes Turnier',
                dwzalt: '1620',
                dwzneu: '1640', 
                punkte: '3.5',
                partien: '5'
            }
        ]
    };
    
    console.log('📊 Mock Player Data:');
    console.log(`   Tournament count: ${mockPlayerDetails.tournaments.length}`);
    mockPlayerDetails.tournaments.forEach((t, i) => {
        console.log(`   ${i + 1}. ${t.turniername}: ${t.dwzalt} → ${t.dwzneu}`);
    });
    
    // Simulate the DWZ command processing
    console.log('\n🤖 Simulating DWZ command processing...');
    
    const mockPlayer = { name: 'Test Player' };
    const details = mockPlayerDetails;
    
    if (details.tournaments && details.tournaments.length > 0) {
        const tournaments = details.tournaments;
        
        console.log(`🏆 Processing tournaments for ${mockPlayer.name}:`);
        console.log(`   Total tournaments: ${tournaments.length}`);
        
        // Import and test the actual chart generation
        const { generateDWZChart } = require('./src/utils/chartGenerator');
        
        try {
            const chartAttachment = await generateDWZChart(tournaments, mockPlayer.name);
            if (chartAttachment) {
                console.log(`   ✅ Chart generated and attached: ${chartAttachment.name}`);
                
                // Check file exists and size
                const fs = require('fs');
                if (fs.existsSync(chartAttachment.attachment)) {
                    const stats = fs.statSync(chartAttachment.attachment);
                    console.log(`   📊 Chart file size: ${(stats.size / 1024).toFixed(1)} KB`);
                    
                    // Clean up
                    fs.unlinkSync(chartAttachment.attachment);
                    console.log(`   🧹 Test file cleaned up`);
                }
            } else {
                console.log(`   ❌ No chart generated (insufficient valid tournament data)`);
            }
        } catch (error) {
            console.error('Error generating DWZ chart:', error);
        }
    }
}

// Test different API data variations that might cause issues
async function testVariations() {
    console.log('\n🧪 Testing different API data variations...');
    
    const variations = [
        {
            name: 'All tournaments have valid DWZ (expected to work)',
            tournaments: [
                { index: 3, turniername: 'Tournament 3', dwzalt: '1660', dwzneu: '1670', punkte: '5', partien: '7' },
                { index: 2, turniername: 'Tournament 2', dwzalt: '1650', dwzneu: '1660', punkte: '4', partien: '6' },
                { index: 1, turniername: 'Tournament 1', dwzalt: '1640', dwzneu: '1650', punkte: '3.5', partien: '5' }
            ]
        },
        {
            name: 'One tournament has empty DWZ strings',
            tournaments: [
                { index: 3, turniername: 'Tournament 3', dwzalt: '', dwzneu: '', punkte: '5', partien: '7' },
                { index: 2, turniername: 'Tournament 2', dwzalt: '1650', dwzneu: '1660', punkte: '4', partien: '6' },
                { index: 1, turniername: 'Tournament 1', dwzalt: '1640', dwzneu: '1650', punkte: '3.5', partien: '5' }
            ]
        },
        {
            name: 'One tournament has zero DWZ values',
            tournaments: [
                { index: 3, turniername: 'Tournament 3', dwzalt: '0', dwzneu: '0', punkte: '5', partien: '7' },
                { index: 2, turniername: 'Tournament 2', dwzalt: '1650', dwzneu: '1660', punkte: '4', partien: '6' },
                { index: 1, turniername: 'Tournament 1', dwzalt: '1640', dwzneu: '1650', punkte: '3.5', partien: '5' }
            ]
        },
        {
            name: 'Two tournaments have invalid DWZ (should fail)',
            tournaments: [
                { index: 3, turniername: 'Tournament 3', dwzalt: '', dwzneu: '', punkte: '5', partien: '7' },
                { index: 2, turniername: 'Tournament 2', dwzalt: '0', dwzneu: '0', punkte: '4', partien: '6' },
                { index: 1, turniername: 'Tournament 1', dwzalt: '1640', dwzneu: '1650', punkte: '3.5', partien: '5' }
            ]
        }
    ];
    
    const { generateDWZChart } = require('./src/utils/chartGenerator');
    
    for (const variation of variations) {
        console.log(`\n   📝 ${variation.name}:`);
        try {
            const chart = await generateDWZChart(variation.tournaments, 'Test Player');
            console.log(`      Result: ${chart ? 'Chart generated ✅' : 'No chart ❌'}`);
            
            if (chart) {
                const fs = require('fs');
                if (fs.existsSync(chart.attachment)) {
                    fs.unlinkSync(chart.attachment);
                }
            }
        } catch (error) {
            console.log(`      Error: ${error.message}`);
        }
    }
}

async function runTests() {
    await testRealWorldScenario();
    await testVariations();
    
    console.log('\n🎯 Conclusions:');
    console.log('===============');
    console.log('The chart generation should work for 3 tournaments IF:');
    console.log('✅ At least 2 tournaments have valid DWZ data');
    console.log('✅ DWZ values are not empty strings or "0"');
    console.log('✅ Tournament objects have dwzalt and dwzneu properties');
    console.log('');
    console.log('💡 If charts are not generating, the debug logs will now show:');
    console.log('• How many tournaments are being processed');
    console.log('• The actual DWZ values for each tournament');
    console.log('• How many tournaments pass the validity filter');
    console.log('• Whether chart generation proceeds or fails');
}

runTests().catch(console.error);
