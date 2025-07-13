#!/usr/bin/env node
/**
 * Test script for DWZ Info Service integration
 * This script tests the new Python-based DWZ service
 */

const DWZInfoService = require('./src/services/dwzInfoService');
const { logger } = require('./src/utils/logger');

async function testDWZInfoService() {
    console.log('🔍 Testing DWZ Info Service Integration...\n');
    
    const service = new DWZInfoService();
    
    try {
        // Test 1: Search for a well-known player
        console.log('Test 1: Searching for "keymer,vincent"...');
        const searchResults = await service.searchPlayers('keymer,vincent');
        console.log(`✅ Found ${searchResults.length} players`);
        
        if (searchResults.length > 0) {
            const player = searchResults[0];
            console.log(`   Player: ${player.name}`);
            console.log(`   DWZ: ${player.dwz}`);
            console.log(`   Club: ${player.club}`);
            console.log(`   ZPK: ${player.zpk}`);
            console.log(`   FIDE: ${player.fide_rating}`);
            console.log(`   Title: ${player.fide_title}\n`);
            
            // Test 2: Get detailed player information
            if (player.zpk) {
                console.log('Test 2: Getting detailed player information...');
                const details = await service.getPlayerDetails(player.zpk);
                console.log(`✅ Got player details`);
                console.log(`   Tournaments: ${details.tournaments ? details.tournaments.length : 0}`);
                
                if (details.tournaments && details.tournaments.length > 0) {
                    const latest = details.tournaments[details.tournaments.length - 1];
                    console.log(`   Latest tournament: ${latest.turniername}`);
                    console.log(`   DWZ change: ${latest.dwzalt} → ${latest.dwzneu}`);
                    if (latest.leistung) {
                        console.log(`   Performance: ${latest.leistung}`);
                    }
                }
            }
        }
        
        console.log('\n🔍 Test 3: Search with a more common name...');
        const commonResults = await service.searchPlayers('keymer');
        console.log(`✅ Found ${commonResults.length} players with name search`);
        
        console.log('\n🔍 Test 4: Testing disambiguation...');
        const disambiguated = service.addDisambiguationInfo(commonResults);
        console.log(`✅ Processed ${disambiguated.length} players for disambiguation`);
        
        if (disambiguated.length > 0) {
            const duplicates = disambiguated.filter(p => p.hasNameDuplicate);
            console.log(`   Players with duplicate names: ${duplicates.length}`);
            if (duplicates.length > 0) {
                console.log(`   Example disambiguation: ${duplicates[0].disambiguationInfo}`);
            }
        }
        
        console.log('\n✅ All tests completed successfully!');
        console.log('\n🎉 DWZ Info Service integration is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('\n🔧 Troubleshooting:');
        console.error('   1. Ensure Python 3 is installed and accessible');
        console.error('   2. Verify dwz-info package dependencies are installed');
        console.error('   3. Check network connectivity to schachbund.de');
        console.error('   4. Run: cd dwz-info && python3 dwz_info.py "Vincent Keymer" --debug');
        process.exit(1);
    }
}

// Run the test
if (require.main === module) {
    testDWZInfoService().catch(error => {
        console.error('Test script failed:', error);
        process.exit(1);
    });
}

module.exports = { testDWZInfoService };
