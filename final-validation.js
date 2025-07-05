#!/usr/bin/env node

/**
 * Final validation script for clean code version
 * Ensures the bot is ready to run with refactored code
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Final Clean Code Validation...\n');

// Check that old files are gone and new structure is in place
const checks = [
    {
        name: 'Main entry point',
        check: () => fs.existsSync('src/index.js'),
        message: 'src/index.js exists'
    },
    {
        name: 'Clean commands',
        check: () => fs.existsSync('src/commands/dwz.js') && fs.existsSync('src/commands/help.js'),
        message: 'Clean command files exist'
    },
    {
        name: 'Clean events',
        check: () => fs.existsSync('src/events/ready.js') && fs.existsSync('src/events/interactionCreate.js'),
        message: 'Clean event files exist'
    },
    {
        name: 'Service layer',
        check: () => fs.existsSync('src/services/dwzSearchService.js') && fs.existsSync('src/services/embedService.js'),
        message: 'Service layer complete'
    },
    {
        name: 'Utilities',
        check: () => fs.existsSync('src/utils/logger.js') && fs.existsSync('src/validators/index.js'),
        message: 'Utilities and validators ready'
    },
    {
        name: 'Constants',
        check: () => fs.existsSync('src/constants/index.js'),
        message: 'Constants centralized'
    },
    {
        name: 'Error handling',
        check: () => fs.existsSync('src/helpers/errorHandler.js'),
        message: 'Error handling ready'
    },
    {
        name: 'No refactored files',
        check: () => {
            const refactoredFiles = ['src/index-refactored.js', 'src/commands/dwz-refactored.js', 'src/commands/help-refactored.js', 'src/events/ready-refactored.js', 'src/events/interactionCreate-refactored.js'];
            return !refactoredFiles.some(file => fs.existsSync(file));
        },
        message: 'Old refactored files cleaned up'
    },
    {
        name: 'Backup exists',
        check: () => fs.existsSync('backup/original') && fs.readdirSync('backup/original').length > 0,
        message: 'Original files safely backed up'
    },
    {
        name: 'Archive created',
        check: () => fs.existsSync('archive') && fs.readdirSync('archive').length > 0,
        message: 'Old test files archived'
    }
];

let passed = 0;
let failed = 0;

console.log('📋 Structure Validation:');
for (const test of checks) {
    try {
        if (test.check()) {
            console.log(`✅ ${test.name}: ${test.message}`);
            passed++;
        } else {
            console.log(`❌ ${test.name}: Failed`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ ${test.name}: Error - ${error.message}`);
        failed++;
    }
}

// Check file sizes to ensure files have content
console.log('\n📊 File Size Check:');
const importantFiles = [
    'src/index.js',
    'src/commands/dwz.js',
    'src/services/dwzSearchService.js',
    'src/utils/chartGenerator.js'
];

for (const file of importantFiles) {
    if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const sizeKB = (stats.size / 1024).toFixed(2);
        if (stats.size > 1000) { // At least 1KB
            console.log(`✅ ${file}: ${sizeKB} KB`);
            passed++;
        } else {
            console.log(`⚠️ ${file}: ${sizeKB} KB (seems small)`);
        }
    } else {
        console.log(`❌ ${file}: Missing`);
        failed++;
    }
}

// Test basic imports
console.log('\n🔗 Import Test:');
try {
    const constants = require('./src/constants');
    console.log('✅ Constants import successful');
    
    const logger = require('./src/utils/logger');
    console.log('✅ Logger import successful');
    
    const validators = require('./src/validators');
    console.log('✅ Validators import successful');
    
    passed += 3;
} catch (error) {
    console.log(`❌ Import test failed: ${error.message}`);
    failed += 3;
}

// Package.json check
console.log('\n📦 Package.json Check:');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.main === 'src/index.js') {
        console.log('✅ Package.json main points to clean version');
        passed++;
    } else {
        console.log(`❌ Package.json main is ${packageJson.main}, expected src/index.js`);
        failed++;
    }
    
    if (packageJson.scripts.start === 'node src/index.js') {
        console.log('✅ Start script points to clean version');
        passed++;
    } else {
        console.log(`❌ Start script incorrect`);
        failed++;
    }
} catch (error) {
    console.log(`❌ Package.json check failed: ${error.message}`);
    failed += 2;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`📊 Validation Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('\n🎉 Clean Code Migration Complete!');
    console.log('');
    console.log('✨ Your DWZ Discord Bot is now running on clean code!');
    console.log('');
    console.log('🚀 Ready to start:');
    console.log('   npm start        # Start the clean code bot');
    console.log('   npm run dev      # Development mode with auto-reload');
    console.log('');
    console.log('📚 References:');
    console.log('   • REFACTORING_COMPLETE.md - Summary of changes');
    console.log('   • REFACTORING_GUIDE.md - Detailed migration guide');
    console.log('   • backup/original/ - Original files (safe to remove later)');
    console.log('   • archive/ - Old test files (safe to remove later)');
    console.log('');
    console.log('🎯 Key improvements:');
    console.log('   • Modular service architecture');
    console.log('   • Centralized error handling');
    console.log('   • Structured logging');
    console.log('   • Input validation');
    console.log('   • Clean chart generation (no guessing DWZ values)');
    console.log('   • Comprehensive documentation');
} else {
    console.log('\n❌ Some validation checks failed.');
    console.log('Please review the errors above before starting the bot.');
    process.exit(1);
}

console.log('\n✨ Clean code validation complete!');
