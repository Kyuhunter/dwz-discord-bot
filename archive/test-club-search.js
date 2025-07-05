#!/usr/bin/env node

// Test script for club-based player search functionality
console.log('Testing club-based player search...');

// Test the search logic for combined name + club searches
function testClubFilterLogic() {
    console.log('\n=== Testing Club Filter Logic ===');
    
    const testCases = [
        'Schmidt München',
        'Müller SV',
        'Wagner Schach',
        'Klaus Berlin',
        'Peters TSV',
        'Johann Club',
        'Maria Frankfurt'
    ];
    
    testCases.forEach(query => {
        console.log(`\nTesting: "${query}"`);
        
        // Simulate the club detection logic
        const clubKeywords = ['SV', 'SC', 'SK', 'TSV', 'FC', 'Verein', 'Schach', 'Club', 'Klub'];
        const words = query.trim().split(/\s+/);
        
        let searchTerm = query;
        let clubFilter = null;
        
        if (words.length >= 2) {
            for (let i = 1; i < words.length; i++) {
                const word = words[i];
                const isClubKeyword = clubKeywords.some(keyword => 
                    word.toLowerCase().includes(keyword.toLowerCase()) || 
                    keyword.toLowerCase().includes(word.toLowerCase())
                );
                
                const looksLikePlace = word.length > 3 && /^[A-ZÄÖÜ]/.test(word);
                
                if (isClubKeyword || looksLikePlace) {
                    searchTerm = words.slice(0, i).join(' ');
                    clubFilter = words.slice(i).join(' ');
                    console.log(`  → Detected: player="${searchTerm}", club filter="${clubFilter}"`);
                    break;
                }
            }
        }
        
        if (!clubFilter) {
            console.log(`  → No club filter detected, searching for full name: "${searchTerm}"`);
        }
    });
}

// Test disambiguation logic
function testDisambiguationLogic() {
    console.log('\n\n=== Testing Disambiguation Logic ===');
    
    // Mock players with same name but different clubs
    const mockPlayers = [
        {
            name: 'Schmidt, Hans',
            dwz: '1850',
            club: 'SC München',
            pkz: '12345',
            birthYear: '1985'
        },
        {
            name: 'Schmidt, Hans',
            dwz: '1650',
            club: 'SV Berlin',
            pkz: '67890',
            birthYear: '1990'
        },
        {
            name: 'Schmidt, Hans',
            dwz: '1750',
            club: 'SC München',
            pkz: '11111',
            birthYear: '1985'
        }
    ];
    
    console.log('Mock players with identical names:');
    mockPlayers.forEach((player, index) => {
        console.log(`  ${index + 1}. ${player.name} - ${player.club} (DWZ: ${player.dwz}, Born: ${player.birthYear})`);
    });
    
    // Group by name
    const nameGroups = mockPlayers.reduce((groups, player) => {
        const cleanName = player.name.replace(/\s*\(\d{4}\)\s*/, '').trim();
        if (!groups[cleanName]) {
            groups[cleanName] = [];
        }
        groups[cleanName].push(player);
        return groups;
    }, {});
    
    console.log('\nDisambiguation results:');
    Object.values(nameGroups).forEach(group => {
        if (group.length > 1) {
            group.forEach(player => {
                const disambiguationParts = [];
                
                // Primary: Club name
                if (player.club) {
                    let clubName = player.club;
                    if (clubName.length > 35) {
                        clubName = clubName.substring(0, 32) + '...';
                    }
                    disambiguationParts.push(clubName);
                }
                
                // Secondary: Birth year
                if (player.birthYear) {
                    disambiguationParts.push(`Born ${player.birthYear}`);
                }
                
                // Tertiary: DWZ if same club
                if (player.dwz) {
                    const sameClubPlayers = group.filter(p => p.club === player.club);
                    if (sameClubPlayers.length > 1) {
                        disambiguationParts.push(`DWZ ${player.dwz}`);
                    }
                }
                
                // Quaternary: Player ID
                if (player.pkz && disambiguationParts.length === 0) {
                    disambiguationParts.push(`ID ${player.pkz}`);
                }
                
                const disambiguation = disambiguationParts.join(' • ');
                console.log(`  → ${player.name}: ${disambiguation}`);
            });
        }
    });
}

// Run tests
testClubFilterLogic();
testDisambiguationLogic();

console.log('\n✅ Club search logic tests completed!');
