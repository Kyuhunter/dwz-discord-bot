#!/usr/bin/env node

/**
 * Simple validation script for refactored code
 * Just checks if files exist and can be required
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Refactored Code Structure...\n');

// Files to check
const files = [
    'src/constants/index.js',
    'src/utils/logger.js', 
    'src/validators/index.js',
    'src/helpers/errorHandler.js',
    'src/services/dwzSearchService.js',
    'src/services/embedService.js',
    'src/utils/chartGenerator.js',
    'src/commands/dwz-refactored.js',
    'src/commands/help-refactored.js',
    'src/events/ready-refactored.js',
    'src/events/interactionCreate-refactored.js',
    'src/index-refactored.js'
];

let allGood = true;

// Check file existence
console.log('📁 Checking file existence...');
for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - NOT FOUND`);
        allGood = false;
    }
}

console.log('\n📊 Checking file sizes...');
for (const file of files) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`📄 ${file}: ${sizeKB} KB`);
    }
}

// Check package.json scripts
console.log('\n🚀 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['start:refactored', 'dev:refactored', 'clean'];

for (const script of requiredScripts) {
    if (packageJson.scripts[script]) {
        console.log(`✅ Script: ${script}`);
    } else {
        console.log(`❌ Script: ${script} - MISSING`);
        allGood = false;
    }
}

// Check directory structure
console.log('\n📂 Checking directory structure...');
const directories = ['src/constants', 'src/services', 'src/validators', 'src/helpers'];

for (const dir of directories) {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        console.log(`✅ Directory: ${dir}`);
    } else {
        console.log(`❌ Directory: ${dir} - MISSING`);
        allGood = false;
    }
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
    console.log('🎉 All refactored files and structure are in place!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Test the refactored bot: npm run start:refactored');
    console.log('2. Compare with original: npm start');
    console.log('3. Run development mode: npm run dev:refactored');
    console.log('');
    console.log('📚 See REFACTORING_GUIDE.md for detailed information.');
} else {
    console.log('❌ Some files or directories are missing.');
    console.log('Please check the errors above.');
}

console.log('\n✨ Refactoring validation complete!');
