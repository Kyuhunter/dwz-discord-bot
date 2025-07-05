#!/usr/bin/env node

// Test configuration and translations
const config = require('./src/utils/config');

function testConfig() {
    console.log('=== Testing Configuration and Translations ===\n');
    
    // Test configuration loading
    console.log('📋 Configuration Test:');
    console.log(`App Name: ${config.get('app.name')}`);
    console.log(`Default Language: ${config.get('language.default')}`);
    console.log(`Max Recent Tournaments: ${config.get('bot.max_recent_tournaments')}`);
    console.log(`Show Player ID: ${config.get('bot.show_player_id')}`);
    console.log(`Success Color: #${config.get('display.colors.success')}`);
    console.log(`Error Color: #${config.get('display.colors.error')}`);
    
    // Test color conversion
    console.log(`\nColor as integer: ${config.getColor('success')}`);
    
    // Test translations
    console.log('\n🌐 German Translation Test:');
    config.setLanguage('de');
    console.log(`Command Name: ${config.t('commands.dwz.name')}`);
    console.log(`Command Description: ${config.t('commands.dwz.description')}`);
    console.log(`Search Title: ${config.t('search.title')}`);
    console.log(`Player Title: ${config.t('player.title')}`);
    console.log(`DWZ Rating Title: ${config.t('player.dwz_rating.title')}`);
    console.log(`No Rating: ${config.t('player.dwz_rating.no_rating')}`);
    console.log(`Data Source: ${config.t('data_source')}`);
    
    // Test interpolation
    console.log('\n🔤 Interpolation Test:');
    console.log(config.t('search.no_players_found', { query: 'Müller' }));
    console.log(config.t('search.found_players', { count: 5, query: 'Schmidt' }));
    console.log(config.t('player.dwz_rating.with_index', { rating: '1500', index: '25' }));
    console.log(config.t('tournaments.title', { count: 3 }));
    
    // Test English fallback
    console.log('\n🇺🇸 English Translation Test:');
    config.setLanguage('en');
    console.log(`Search Title: ${config.t('search.title')}`);
    console.log(`Player Title: ${config.t('player.title')}`);
    console.log(`Error Title: ${config.t('errors.title')}`);
    
    // Test available languages
    console.log('\n🌍 Available Languages:');
    console.log(config.getAvailableLanguages().join(', '));
    
    // Test missing translation
    console.log('\n⚠️ Missing Translation Test:');
    console.log(`Missing key: ${config.t('this.key.does.not.exist')}`);
    
    console.log('\n✅ Configuration and Translation tests completed!');
}

testConfig();
