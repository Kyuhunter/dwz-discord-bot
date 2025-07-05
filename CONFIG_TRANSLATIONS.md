# DWZ Discord Bot - Configuration and Translations

## Overview

The DWZ Discord Bot has been enhanced with a comprehensive configuration and translation system to support multiple languages and customizable behavior.

## Files Created

### Configuration Files

1. **`config.yaml`** - Main configuration file
   - App settings (name, version, debug mode)
   - Language settings (default: German, fallback: English)
   - Bot behavior (max tournaments, search results, feature flags)
   - Rate limiting settings
   - Display settings (colors, embed configuration)
   - External service endpoints
   - Feature flags

2. **`src/utils/config.js`** - Configuration manager
   - Loads YAML configuration
   - Manages translations
   - Provides translation interpolation
   - Supports language switching
   - Fallback to default values

### Translation Files

3. **`translations/de.yaml`** - German translations
   - Complete German interface
   - All user-facing text translated
   - Error messages in German
   - Status messages and tips

4. **`translations/en.yaml`** - English translations
   - Complete English interface
   - Fallback language support
   - All user-facing text in English

## Key Features Implemented

### Configuration Management
- **Flexible Settings**: All bot behavior is configurable
- **Environment-specific**: Easy to adjust for different deployments
- **Feature Flags**: Enable/disable features without code changes
- **Rate Limiting**: Configurable request limits to protect external services

### Translation System
- **Multi-language Support**: German (default) and English
- **Dynamic Language Switching**: Can change language at runtime
- **Parameter Interpolation**: Support for dynamic values in translations
- **Fallback System**: Falls back to English if German translation missing
- **Missing Translation Warnings**: Logs when translations are not found

### Bot Enhancements
- **Configurable Tournament Count**: Show 1-10 recent tournaments (default: 3)
- **Customizable Colors**: Different colors for success, info, warning, error
- **Feature Toggles**: Can disable/enable FIDE info, member info, etc.
- **Rate Limiting**: Protects against overwhelming external services
- **Flexible Display**: Configure embed appearance and content

## Configuration Options

### Bot Behavior
```yaml
bot:
  max_recent_tournaments: 3      # Number of tournaments to show
  max_search_results: 10         # Max players in search results
  show_player_id: true          # Show ZPK in results
  show_fide_info: true          # Show FIDE rating info
  show_member_info: true        # Show member number/status
  show_tournament_performance: true  # Show performance data
  show_dwz_changes: true        # Show rating changes
  show_club_info: true          # Show club information
```

### Rate Limiting
```yaml
rate_limiting:
  max_requests_per_minute: 30   # Request limit per minute
  max_concurrent_requests: 5    # Concurrent request limit
  request_timeout: 15000        # Request timeout (ms)
  max_retries: 2                # Retry attempts
```

### Display Settings
```yaml
display:
  colors:
    success: "00FF00"           # Green for success
    info: "0099FF"              # Blue for info
    warning: "FFCC00"           # Yellow for warning
    error: "FF0000"             # Red for error
  embed:
    show_timestamp: true        # Show timestamp on embeds
    show_footer: true           # Show footer with data source
```

## Usage Examples

### Using Configuration
```javascript
const config = require('./src/utils/config');

// Get configuration values
const maxTournaments = config.get('bot.max_recent_tournaments', 3);
const showPlayerId = config.get('bot.show_player_id', true);
const successColor = config.getColor('success');  // Returns integer
```

### Using Translations
```javascript
const config = require('./src/utils/config');

// Basic translation
const title = config.t('player.title');  // "♟️ DWZ-Spielerinformationen"

// Translation with parameters
const message = config.t('search.found_players', { 
  count: 5, 
  query: 'Müller' 
});  // "Es wurden 5 Spieler gefunden, die zu "Müller" passen:"

// Change language
config.setLanguage('en');
const englishTitle = config.t('player.title');  // "♟️ DWZ Player Information"
```

### German Translation Examples
- `search.title` → "🔍 DWZ-Suche"
- `player.dwz_rating.title` → "🏆 DWZ-Wertung"
- `player.fide_rating.title` → "🌍 FIDE-Wertung"
- `tournaments.title` → "🏁 Aktuelle Turniere (Letzte {count})"
- `errors.connection_failed.title` → "Verbindung zu schachbund.de nicht möglich"

## Implementation Benefits

1. **User Experience**: German users get native language interface
2. **Maintainability**: All text centralized in translation files
3. **Flexibility**: Easy to add new languages or modify behavior
4. **Performance**: Configurable rate limiting protects external services
5. **Customization**: Server admins can adjust bot behavior without code changes
6. **Accessibility**: Clear German error messages and instructions

## Integration with Main Command

The main DWZ command (`src/commands/dwz.js`) has been updated to use:
- Configuration-driven behavior
- German translations for all user-facing text
- Configurable colors and display options
- Rate limiting settings
- Feature flags for optional functionality

## Testing

A comprehensive test file (`test-config.js`) verifies:
- Configuration loading
- Translation functionality
- Parameter interpolation
- Language switching
- Color conversion
- Missing translation handling

## Future Enhancements

The configuration system supports future features:
- Caching system (configurable)
- Statistics tracking (optional)
- Admin commands (can be enabled/disabled)
- Tournament notifications (planned feature)
- Additional languages (framework ready)

This configuration and translation system makes the DWZ Discord Bot more professional, user-friendly, and maintainable while providing excellent support for German-speaking chess players.
