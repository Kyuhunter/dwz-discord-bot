#!/usr/bin/env node

// Simple test for chart generation
console.log('Testing chart generation...');

const { generateDWZStatistics } = require('./src/utils/chartGenerator.js');

// Mock tournament data
const mockTournaments = [
    {
        index: 1,
        turniername: 'Test Tournament 1',
        dwzalt: '1650',
        dwzneu: '1675',
        punkte: '5.5',
        partien: '7'
    },
    {
        index: 2,
        turniername: 'Test Tournament 2',
        dwzalt: '1675',
        dwzneu: '1692',
        punkte: '4.0',
        partien: '6'
    }
];

try {
    const stats = generateDWZStatistics(mockTournaments);
    console.log('Statistics:', stats);
    console.log('✅ Chart utilities working correctly');
} catch (error) {
    console.error('❌ Error:', error.message);
}
