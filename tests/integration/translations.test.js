/**
 * Integration Tests for Translation System
 */

const path = require('path');
const yaml = require('js-yaml');
const fs = require('fs');

// Mock jest.fn if it's not available
if (typeof jest === 'undefined') {
  global.jest = { fn: () => () => {} };
}

describe('Translation System', () => {
  let englishTranslations, germanTranslations;
  let enContent, deContent;

  beforeAll(() => {
    // Use synchronous file reading with absolute paths
    try {
      // Use process.cwd() to get the project root since Jest might change working directory
      const projectRoot = process.cwd();
      const enPath = path.join(projectRoot, 'translations/en.yaml');
      const dePath = path.join(projectRoot, 'translations/de.yaml');
      
      // Debug output for path resolution
      console.log('Project root:', projectRoot);
      console.log('English path:', enPath);
      console.log('German path:', dePath);
      
      // Check if files exist
      if (!fs.existsSync(enPath)) {
        // Try alternative path resolution
        const altEnPath = path.resolve(__dirname, '../../translations/en.yaml');
        console.log('Alternative English path:', altEnPath);
        if (fs.existsSync(altEnPath)) {
          const altDePath = path.resolve(__dirname, '../../translations/de.yaml');
          enContent = fs.readFileSync(altEnPath, 'utf8');
          deContent = fs.readFileSync(altDePath, 'utf8');
        } else {
          throw new Error(`English translation file not found at: ${enPath} or ${altEnPath}`);
        }
      } else {
        enContent = fs.readFileSync(enPath, 'utf8');
        deContent = fs.readFileSync(dePath, 'utf8');
      }
      
      // Parse YAML content
      englishTranslations = yaml.load(enContent);
      germanTranslations = yaml.load(deContent);
      
      // Validate that parsing was successful
      if (!englishTranslations || typeof englishTranslations !== 'object') {
        throw new Error('Failed to parse English translations or result is not an object');
      }
      if (!germanTranslations || typeof germanTranslations !== 'object') {
        throw new Error('Failed to parse German translations or result is not an object');
      }
      
    } catch (error) {
      console.error('Error loading translation files:', error);
      throw error;
    }
  });

  describe('Translation File Structure', () => {
    test('should have valid YAML syntax', () => {
      expect(englishTranslations).toBeDefined();
      expect(germanTranslations).toBeDefined();
      expect(typeof englishTranslations).toBe('object');
      expect(typeof germanTranslations).toBe('object');
    });

    test('should have same structure in both languages', () => {
      const enKeys = extractAllKeys(englishTranslations);
      const deKeys = extractAllKeys(germanTranslations);
      
      expect(enKeys).toEqual(deKeys);
    });

    test('should have all required translation sections', () => {
      const requiredSections = [
        'commands',
        'search',
        'player',
        'tournaments',
        'errors',
        'status',
        'common'
      ];

      requiredSections.forEach(section => {
        expect(englishTranslations).toHaveProperty(section);
        expect(germanTranslations).toHaveProperty(section);
      });
    });
  });

  describe('Command Translations', () => {
    test('should have DWZ command translations', () => {
      expect(englishTranslations.commands).toHaveProperty('dwz');
      expect(germanTranslations.commands).toHaveProperty('dwz');
      
      expect(englishTranslations.commands.dwz).toHaveProperty('name');
      expect(englishTranslations.commands.dwz).toHaveProperty('description');
      expect(englishTranslations.commands.dwz.options).toHaveProperty('name');
      
      expect(germanTranslations.commands.dwz).toHaveProperty('name');
      expect(germanTranslations.commands.dwz).toHaveProperty('description');
      expect(germanTranslations.commands.dwz.options).toHaveProperty('name');
    });

    test('should have help command translations', () => {
      expect(englishTranslations.commands).toHaveProperty('help');
      expect(germanTranslations.commands).toHaveProperty('help');
    });

    test('should have consistent command names', () => {
      // Command names should be the same in both languages
      expect(englishTranslations.commands.dwz.name).toBe('dwz');
      expect(germanTranslations.commands.dwz.name).toBe('dwz');
    });
  });

  describe('Search Result Translations', () => {
    test('should have all search result messages', () => {
      const requiredSearchKeys = [
        'title',
        'results_title',
        'no_players_found',
        'found_players',
        'tips',
        'direct_search',
        'more_results'
      ];

      requiredSearchKeys.forEach(key => {
        expect(englishTranslations.search).toHaveProperty(key);
        expect(germanTranslations.search).toHaveProperty(key);
      });
    });

    test('should have placeholder support', () => {
      // Check for {count} and {query} placeholders
      expect(englishTranslations.search.no_players_found).toContain('{query}');
      expect(germanTranslations.search.no_players_found).toContain('{query}');
      
      expect(englishTranslations.search.found_players).toContain('{count}');
      expect(germanTranslations.search.found_players).toContain('{count}');
    });
  });

  describe('Error Message Translations', () => {
    test('should have all error messages', () => {
      const requiredErrorKeys = [
        'general_error',
        'network_error',
        'search_failed',
        'invalid_input',
        'rate_limited'
      ];

      requiredErrorKeys.forEach(key => {
        expect(englishTranslations.errors).toHaveProperty(key);
        expect(germanTranslations.errors).toHaveProperty(key);
      });
    });

    test('should have non-empty error messages', () => {
      const checkNonEmpty = (obj, path = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          if (typeof value === 'string') {
            expect(value.trim()).not.toBe('');
          } else if (typeof value === 'object' && value !== null) {
            checkNonEmpty(value, currentPath);
          }
        });
      };

      checkNonEmpty(englishTranslations.errors);
      checkNonEmpty(germanTranslations.errors);
    });
  });

  describe('Chart Translations', () => {
    test('should have chart-related translations', () => {
      expect(englishTranslations.chart).toHaveProperty('title');
      expect(englishTranslations.chart).toHaveProperty('rating_axis');
      expect(englishTranslations.chart).toHaveProperty('date_axis');
      
      expect(germanTranslations.chart).toHaveProperty('title');
      expect(germanTranslations.chart).toHaveProperty('rating_axis');
      expect(germanTranslations.chart).toHaveProperty('date_axis');
    });
  });

  describe('Default Language (English)', () => {
    test('should use English as default language', () => {
      // Verify that all English translations exist and are non-empty
      const validateTranslations = (obj, path = '') => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key;
          
          if (typeof value === 'string') {
            expect(value.trim()).not.toBe('');
            // English should not contain obvious German words (except proper nouns like schachbund.de)
            const germanWords = ['spieler', 'turnier', 'wertung', 'verein', 'fehler'];
            const lowerValue = value.toLowerCase();
            germanWords.forEach(word => {
              // Skip schachbund.de domain name and other proper nouns
              if (!lowerValue.includes('schachbund.de')) {
                expect(lowerValue).not.toContain(word.toLowerCase());
              }
            });
          } else if (typeof value === 'object' && value !== null) {
            validateTranslations(value, currentPath);
          }
        });
      };

      validateTranslations(englishTranslations);
    });

    test('should have proper English grammar and spelling', () => {
      // Check for common English patterns
      const englishPatterns = [
        { key: 'commands.dwz.description', pattern: /search.*player.*rating/i },
        { key: 'search.no_players_found', pattern: /no.*found/i },
        { key: 'errors.network_error', pattern: /error|failed|problem/i }
      ];

      englishPatterns.forEach(({ key, pattern }) => {
        const value = getNestedValue(englishTranslations, key);
        if (value) {
          expect(value).toMatch(pattern);
        }
      });
    });
  });

  describe('German Translations Quality', () => {
    test('should have proper German grammar', () => {
      // Check for German-specific patterns
      const germanPatterns = [
        { key: 'commands.dwz.description', pattern: /such.*spieler/i },
        { key: 'search.no_players_found', pattern: /keine.*gefunden/i },
        { key: 'errors.network_error', pattern: /fehler|problem|fehlgeschlagen/i }
      ];

      germanPatterns.forEach(({ key, pattern }) => {
        const value = getNestedValue(germanTranslations, key);
        if (value) {
          expect(value).toMatch(pattern);
        }
      });
    });

    test('should use proper German umlauts', () => {
      const germanText = JSON.stringify(germanTranslations);
      // German translations should contain umlauts
      expect(germanText).toMatch(/[äöüÄÖÜß]/);
    });
  });

  describe('Translation Consistency', () => {
    test('should have consistent terminology', () => {
      // DWZ should appear in both languages
      const enText = JSON.stringify(englishTranslations);
      const deText = JSON.stringify(germanTranslations);
      
      expect(enText).toContain('DWZ');
      expect(deText).toContain('DWZ');
    });

    test('should have same number of placeholders', () => {
      const countPlaceholders = (text) => {
        const matches = text.match(/{[^}]+}/g);
        return matches ? matches.length : 0;
      };

      const compareSection = (enSection, deSection, path = '') => {
        Object.keys(enSection).forEach(key => {
          const currentPath = path ? `${path}.${key}` : key;
          const enValue = enSection[key];
          const deValue = deSection[key];

          if (typeof enValue === 'string' && typeof deValue === 'string') {
            const enPlaceholders = countPlaceholders(enValue);
            const dePlaceholders = countPlaceholders(deValue);
            
            expect(enPlaceholders).toBe(dePlaceholders);
          } else if (typeof enValue === 'object' && typeof deValue === 'object') {
            compareSection(enValue, deValue, currentPath);
          }
        });
      };

      compareSection(englishTranslations, germanTranslations);
    });
  });

  describe('File Integrity', () => {
    test('should not have BOM or encoding issues', () => {
      const enPath = path.resolve(__dirname, '../../translations/en.yaml');
      const dePath = path.resolve(__dirname, '../../translations/de.yaml');
      
      const enBuffer = fs.readFileSync(enPath);
      const deBuffer = fs.readFileSync(dePath);
      
      // Should not start with BOM
      expect(enBuffer[0]).not.toBe(0xEF);
      expect(deBuffer[0]).not.toBe(0xEF);
    });

    test('should have proper line endings', () => {
      // Use the content loaded in beforeAll
      expect(enContent).toBeDefined();
      expect(deContent).toBeDefined();
      
      // Should use Unix line endings (LF) or Windows (CRLF), but be consistent
      const enLineEnding = enContent.includes('\r\n') ? 'CRLF' : 'LF';
      const deLineEnding = deContent.includes('\r\n') ? 'CRLF' : 'LF';
      
      expect(enLineEnding).toBe(deLineEnding);
    });
  });
});

// Helper functions
function extractAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    keys.push(fullKey);
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(extractAllKeys(value, fullKey));
    }
  }
  
  return keys.sort();
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : null;
  }, obj);
}
