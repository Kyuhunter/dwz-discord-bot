#!/usr/bin/env node

// Simple config test
console.log('Starting simple config test...');

try {
    const path = require('path');
    const fs = require('fs');
    
    // Check if files exist
    const configPath = path.join(__dirname, 'config.yaml');
    const translationsPath = path.join(__dirname, 'translations');
    
    console.log('Config file exists:', fs.existsSync(configPath));
    console.log('Translations dir exists:', fs.existsSync(translationsPath));
    
    if (fs.existsSync(translationsPath)) {
        const files = fs.readdirSync(translationsPath);
        console.log('Translation files:', files);
    }
    
    console.log('Test completed successfully');
    process.exit(0);
} catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
}
