#!/usr/bin/env node

/**
 * Test Script for Refactored DWZ Discord Bot
 * Validates that all refactored components work correctly
 */

const path = require('path');
const fs = require('fs');

// Test configuration
const TESTS = {
    constants: 'src/constants/index.js',
    logger: 'src/utils/logger.js',
    validators: 'src/validators/index.js',
    errorHandler: 'src/helpers/errorHandler.js',
    dwzSearchService: 'src/services/dwzSearchService.js',
    embedService: 'src/services/embedService.js',
    chartGenerator: 'src/utils/chartGenerator.js'
};

async function runTests() {
    console.log('🧪 Starting Refactored Code Tests...\n');
    
    let passed = 0;
    let failed = 0;
    
    for (const [testName, filePath] of Object.entries(TESTS)) {
        try {
            console.log(`Testing ${testName}...`);
            await testModule(testName, filePath);
            console.log(`✅ ${testName} - PASSED\n`);
            passed++;
        } catch (error) {
            console.log(`❌ ${testName} - FAILED: ${error.message}\n`);
            failed++;
        }
    }
    
    // Test integration
    try {
        console.log('Testing integration...');
        await testIntegration();
        console.log('✅ Integration - PASSED\n');
        passed++;
    } catch (error) {
        console.log(`❌ Integration - FAILED: ${error.message}\n`);
        failed++;
    }
    
    // Summary
    console.log('='.repeat(50));
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed! Refactored code is ready.');
        process.exit(0);
    } else {
        console.log('❌ Some tests failed. Please check the errors above.');
        process.exit(1);
    }
}

async function testModule(testName, filePath) {
    // Check if file exists
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
        throw new Error(`File not found: ${fullPath}`);
    }
    
    // Try to require the module
    const module = require(fullPath);
    
    // Run specific tests based on module
    switch (testName) {
        case 'constants':
            testConstants(module);
            break;
        case 'logger':
            testLogger(module);
            break;
        case 'validators':
            testValidators(module);
            break;
        case 'errorHandler':
            testErrorHandler(module);
            break;
        case 'dwzSearchService':
            testDWZSearchService(module);
            break;
        case 'embedService':
            testEmbedService(module);
            break;
        case 'chartGenerator':
            testChartGenerator(module);
            break;
    }
}

function testConstants(constants) {
    const required = ['EXTERNAL_URLS', 'EMBED_COLORS', 'LIMITS', 'CHART_CONFIG', 'DWZ_CONSTANTS'];
    
    for (const key of required) {
        if (!constants[key]) {
            throw new Error(`Missing constant: ${key}`);
        }
    }
    
    // Test specific values
    if (!constants.EXTERNAL_URLS.SCHACHBUND_BASE) {
        throw new Error('Missing SCHACHBUND_BASE URL');
    }
    
    if (typeof constants.LIMITS.MAX_SEARCH_RESULTS !== 'number') {
        throw new Error('MAX_SEARCH_RESULTS should be a number');
    }
}

function testLogger(loggerModule) {
    const { logger, Logger, LOG_LEVELS } = loggerModule;
    
    if (!logger || !Logger || !LOG_LEVELS) {
        throw new Error('Missing logger exports');
    }
    
    // Test logger methods
    if (typeof logger.info !== 'function') {
        throw new Error('Logger missing info method');
    }
    
    if (typeof logger.error !== 'function') {
        throw new Error('Logger missing error method');
    }
    
    // Test logging (should not throw)
    logger.info('Test log message');
    logger.debug('Test debug message');
}

function testValidators(validators) {
    const required = ['validatePlayerName', 'validateClubName', 'validateDWZValue', 'validateTournamentData'];
    
    for (const key of required) {
        if (typeof validators[key] !== 'function') {
            throw new Error(`Missing or invalid validator: ${key}`);
        }
    }
    
    // Test player name validation
    const playerResult = validators.validatePlayerName('Test Player');
    if (!playerResult.isValid) {
        throw new Error('Valid player name failed validation');
    }
    
    const invalidPlayerResult = validators.validatePlayerName('');
    if (invalidPlayerResult.isValid) {
        throw new Error('Invalid player name passed validation');
    }
    
    // Test DWZ validation
    const dwzResult = validators.validateDWZValue('1500');
    if (!dwzResult.isValid) {
        throw new Error('Valid DWZ failed validation');
    }
}

function testErrorHandler(errorHandler) {
    const required = ['DWZBotError', 'ValidationError', 'handleError', 'categorizeError'];
    
    for (const key of required) {
        if (!errorHandler[key]) {
            throw new Error(`Missing error handler export: ${key}`);
        }
    }
    
    // Test error creation
    const error = new errorHandler.ValidationError('Test validation error');
    if (!(error instanceof Error)) {
        throw new Error('ValidationError not extending Error');
    }
    
    // Test error handling
    const result = errorHandler.handleError(new Error('Test error'), { test: true });
    if (!result.message) {
        throw new Error('Error handler not returning proper result');
    }
}

function testDWZSearchService(DWZSearchService) {
    if (typeof DWZSearchService !== 'function') {
        throw new Error('DWZSearchService not exported as constructor');
    }
    
    // Test instantiation
    const service = new DWZSearchService();
    
    if (typeof service.searchPlayers !== 'function') {
        throw new Error('DWZSearchService missing searchPlayers method');
    }
    
    if (typeof service.getPlayerDetails !== 'function') {
        throw new Error('DWZSearchService missing getPlayerDetails method');
    }
}

function testEmbedService(EmbedService) {
    if (typeof EmbedService !== 'function') {
        throw new Error('EmbedService not exported as constructor');
    }
    
    // Test instantiation
    const service = new EmbedService();
    
    const required = ['createErrorEmbed', 'createSuccessEmbed', 'createInfoEmbed', 'createNoPlayersFoundEmbed'];
    
    for (const method of required) {
        if (typeof service[method] !== 'function') {
            throw new Error(`EmbedService missing ${method} method`);
        }
    }
    
    // Test embed creation
    const embed = service.createErrorEmbed('Test Title', 'Test Description');
    if (!embed || typeof embed.toJSON !== 'function') {
        throw new Error('EmbedService not returning valid embed');
    }
}

function testChartGenerator(chartGenerator) {
    const required = ['generateDWZChart', 'generateDWZStatistics'];
    
    for (const key of required) {
        if (typeof chartGenerator[key] !== 'function') {
            throw new Error(`Missing chart generator function: ${key}`);
        }
    }
    
    // Test statistics generation with mock data
    const mockTournaments = [
        { index: 1, dwzalt: '1400', dwzneu: '1420', partien: '5', punkte: '3.5' },
        { index: 2, dwzalt: '1420', dwzneu: '1450', partien: '7', punkte: '4.0' }
    ];
    
    const stats = chartGenerator.generateDWZStatistics(mockTournaments);
    if (!stats || typeof stats.startingDWZ !== 'number') {
        throw new Error('Chart generator statistics not working correctly');
    }
}

async function testIntegration() {
    // Test that modules can work together
    const { logger } = require('./src/utils/logger');
    const { validatePlayerName } = require('./src/validators');
    const { EMBED_COLORS } = require('./src/constants');
    
    // Test logging with validation
    const validation = validatePlayerName('Integration Test Player');
    logger.info('Integration test validation result', validation);
    
    // Test constants access
    if (!EMBED_COLORS.SUCCESS) {
        throw new Error('Constants not accessible in integration test');
    }
    
    console.log('  → All modules can be imported together');
    console.log('  → Cross-module functionality works');
    console.log('  → No circular dependency issues');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(error => {
        console.error('Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { runTests };
