#!/usr/bin/env node

// Test chart image generation
console.log('Testing chart image generation...');

const { generateDWZChart } = require('./src/utils/chartGenerator.js');

const mockTournaments = [
    {
        index: 1,
        turniername: 'Vereinsmeisterschaft 2023',
        dwzalt: '1650',
        dwzneu: '1675',
        punkte: '5.5',
        partien: '7'
    },
    {
        index: 2,
        turniername: 'Stadtmeisterschaft',
        dwzalt: '1675',
        dwzneu: '1692',
        punkte: '4.0',
        partien: '6'
    },
    {
        index: 3,
        turniername: 'Bayern Open',
        dwzalt: '1692',
        dwzneu: '1688',
        punkte: '3.5',
        partien: '7'
    }
];

async function testChart() {
    try {
        console.log('Generating chart...');
        const chartAttachment = await generateDWZChart(mockTournaments, 'Test Player');
        
        if (chartAttachment) {
            console.log('✅ Chart generated successfully');
            console.log(`   File name: ${chartAttachment.name}`);
            
            // Check if file exists
            const fs = require('fs');
            if (fs.existsSync(chartAttachment.filePath)) {
                const stats = fs.statSync(chartAttachment.filePath);
                console.log(`   File size: ${(stats.size / 1024).toFixed(1)} KB`);
                console.log('   ✅ Chart file created successfully');
            } else {
                console.log('   ❌ Chart file not found');
            }
        } else {
            console.log('❌ Chart generation returned null');
        }
    } catch (error) {
        console.error('❌ Error generating chart:', error.message);
        console.error('Stack:', error.stack.substring(0, 500));
    }
}

testChart();
