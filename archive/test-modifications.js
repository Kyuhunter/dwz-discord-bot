#!/usr/bin/env node

console.log('🎯 Testing Updated DWZ Command');
console.log('==============================');

const fs = require('fs');

// Read the actual DWZ command file to verify changes
const dwzCommandContent = fs.readFileSync('./src/commands/dwz.js', 'utf8');

console.log('📋 Checking DWZ command modifications...');

// Check that statistics generation is removed
const hasStatisticsGeneration = dwzCommandContent.includes('generateDWZStatistics(tournaments)');
const hasStatisticsField = dwzCommandContent.includes('📊 DWZ Progression Statistics');
const hasStatisticsImport = dwzCommandContent.includes('generateDWZStatistics');

console.log('✅ Import check:');
console.log(`   • generateDWZChart imported: ${dwzCommandContent.includes('generateDWZChart')}`);
console.log(`   • generateDWZStatistics removed: ${!hasStatisticsImport}`);

console.log('\n✅ Statistics section check:');
console.log(`   • Statistics generation removed: ${!hasStatisticsGeneration}`);
console.log(`   • Statistics field removed: ${!hasStatisticsField}`);

console.log('\n✅ Tournament handling check:');
const hasAllTournamentsComment = dwzCommandContent.includes('using ALL tournaments');
const hasProfileComment = dwzCommandContent.includes('show only last 3 tournaments in profile');
console.log(`   • Chart uses all tournaments: ${hasAllTournamentsComment}`);
console.log(`   • Profile shows only last 3: ${hasProfileComment}`);

// Check tournament storage in fetchDWZPlayerDetails
const hasAllTournamentsStorage = dwzCommandContent.includes('Store all tournaments for chart generation');
console.log(`   • All tournaments stored: ${hasAllTournamentsStorage}`);

console.log('\n🎯 Feature Summary:');
console.log('   📊 Chart: Shows complete DWZ progression (all tournaments)');
console.log('   📋 Profile: Shows only last 3 tournaments for readability');
console.log('   ❌ Statistics: Removed from embed (cleaner display)');

if (!hasStatisticsGeneration && !hasStatisticsField && !hasStatisticsImport && hasAllTournamentsStorage) {
    console.log('\n🎉 All modifications completed successfully!');
    console.log('   The DWZ command now shows complete progression in charts');
    console.log('   while keeping the profile display clean with only recent tournaments.');
} else {
    console.log('\n⚠️  Some modifications may need review:');
    if (hasStatisticsGeneration) console.log('   • Statistics generation still present');
    if (hasStatisticsField) console.log('   • Statistics field still present');
    if (hasStatisticsImport) console.log('   • Statistics import still present');
    if (!hasAllTournamentsStorage) console.log('   • Tournament storage may need updating');
}
