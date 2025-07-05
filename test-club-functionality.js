#!/usr/bin/env node

// Simple test for club-based search functionality
console.log('🧪 Testing club-based search with "Schmidt München"...');

// Test the enhanced club detection
function testClubDetection(query) {
    console.log(`\nTesting query: "${query}"`);
    
    const clubKeywords = ['SV', 'SC', 'SK', 'TSV', 'FC', 'TuS', 'Verein', 'Schach', 'Club', 'Klub', 'Chess'];
    const cityPatterns = /\b([A-ZÄÖÜ][a-zäöüß]{3,}(?:-[A-ZÄÖÜ][a-zäöüß]+)*)\b/;
    const words = query.trim().split(/\s+/);
    
    let searchTerm = query;
    let clubFilter = null;
    
    if (words.length >= 2) {
        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const remainingWords = words.slice(i);
            
            const isClubKeyword = clubKeywords.some(keyword => 
                word.toLowerCase() === keyword.toLowerCase() ||
                word.toLowerCase().includes(keyword.toLowerCase()) || 
                keyword.toLowerCase().includes(word.toLowerCase())
            );
            
            const looksLikePlace = cityPatterns.test(word);
            const isClubPattern = /^(SG|TSG|PSV|BSV|ESV|ASV|LSV|VSK|VfL|SpVgg|Sp\.?Vgg)$/i.test(word);
            
            const hasClubContext = remainingWords.some(w => 
                clubKeywords.some(keyword => w.toLowerCase().includes(keyword.toLowerCase()))
            );
            
            if (isClubKeyword || looksLikePlace || isClubPattern || hasClubContext) {
                searchTerm = words.slice(0, i).join(' ');
                clubFilter = words.slice(i).join(' ');
                console.log(`  ✅ Detected: player="${searchTerm}", club filter="${clubFilter}"`);
                console.log(`  📍 Reason: isClubKeyword=${isClubKeyword}, looksLikePlace=${looksLikePlace}, isClubPattern=${isClubPattern}, hasClubContext=${hasClubContext}`);
                break;
            }
        }
    }
    
    if (!clubFilter) {
        console.log(`  ❌ No club filter detected for "${query}"`);
    }
    
    return { searchTerm, clubFilter };
}

// Test various query patterns
const testQueries = [
    'Schmidt München',
    'Müller SV',
    'Wagner Berlin',
    'Peters FC',
    'Klaus Schach',
    'Maria Hamburg',
    'Johann Club',
    'Lisa TSV',
    'David Frankfurt',
    'Anna Verein',
    'Schmidt, Hans München',  // With comma
    'Müller (SV Berlin)',     // With parentheses
    'Wagner - SC Hamburg',    // With dash
    'Just Name',              // No club
    'Single'                  // Single word
];

testQueries.forEach(testClubDetection);

console.log('\n✅ Club detection tests completed!');
console.log('\n🧪 Testing club filtering logic...');

// Test club filtering
function testClubFiltering() {
    const mockPlayers = [
        { name: 'Schmidt, Hans', club: 'SC München 1980' },
        { name: 'Schmidt, Klaus', club: 'SV München-Nord' },
        { name: 'Schmidt, Peter', club: 'FC Bayern München e.V.' },
        { name: 'Schmidt, Maria', club: 'Berlin Chess Club' },
        { name: 'Schmidt, Anna', club: 'SV Berlin-West' },
        { name: 'Schmidt, David', club: null }
    ];
    
    const clubFilter = 'München';
    
    console.log(`\nFiltering players with club containing "${clubFilter}":`);
    
    const filtered = mockPlayers.filter(player => {
        if (!player.club) return false;
        
        const clubLower = player.club.toLowerCase();
        const filterLower = clubFilter.toLowerCase();
        
        // Direct substring match
        if (clubLower.includes(filterLower) || filterLower.includes(clubLower)) {
            return true;
        }
        
        // Word-based matching
        const clubWords = clubLower.split(/\s+/);
        const filterWords = filterLower.split(/\s+/);
        
        const hasWordMatch = filterWords.some(filterWord => 
            clubWords.some(clubWord => 
                clubWord.includes(filterWord) || filterWord.includes(clubWord)
            )
        );
        
        // Abbreviation matches
        const hasAbbrevMatch = filterWords.some(filterWord => {
            if (filterWord.length <= 3) {
                return clubWords.some(clubWord => 
                    clubWord.startsWith(filterWord) || 
                    clubWord === filterWord
                );
            }
            return false;
        });
        
        return hasWordMatch || hasAbbrevMatch;
    });
    
    filtered.forEach(player => {
        console.log(`  ✅ ${player.name} - ${player.club}`);
    });
    
    console.log(`\nFound ${filtered.length} out of ${mockPlayers.length} players matching "${clubFilter}"`);
}

testClubFiltering();

console.log('\n🎯 All tests completed successfully!');
