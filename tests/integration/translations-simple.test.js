/**
 * Simplified Translation Tests
 */

const path = require('path');
const yaml = require('js-yaml');

// Bypass fs mocking
const fs = jest.requireActual('fs');

describe('Translation System', () => {
  let englishTranslations, germanTranslations;

  beforeAll(() => {
    try {
      const enPath = path.join(__dirname, '../../translations/en.yaml');
      const dePath = path.join(__dirname, '../../translations/de.yaml');
      
      const enContent = fs.readFileSync(enPath, 'utf8');
      const deContent = fs.readFileSync(dePath, 'utf8');
      
      englishTranslations = yaml.load(enContent);
      germanTranslations = yaml.load(deContent);
    } catch (error) {
      console.error('Failed to load translation files:', error);
      throw error;
    }
  });

  test('should load translation files successfully', () => {
    expect(englishTranslations).toBeDefined();
    expect(germanTranslations).toBeDefined();
    expect(typeof englishTranslations).toBe('object');
    expect(typeof germanTranslations).toBe('object');
  });

  test('should have required main sections', () => {
    const requiredSections = ['commands', 'search', 'player', 'tournaments', 'errors', 'status', 'common'];
    
    requiredSections.forEach(section => {
      expect(englishTranslations).toHaveProperty(section);
      expect(germanTranslations).toHaveProperty(section);
    });
  });

  test('should have DWZ command translations', () => {
    expect(englishTranslations.commands).toHaveProperty('dwz');
    expect(germanTranslations.commands).toHaveProperty('dwz');
    
    expect(englishTranslations.commands.dwz).toHaveProperty('name', 'dwz');
    expect(germanTranslations.commands.dwz).toHaveProperty('name', 'dwz');
  });

  test('should have required search messages', () => {
    const searchKeys = ['title', 'no_players_found', 'found_players'];
    
    searchKeys.forEach(key => {
      expect(englishTranslations.search).toHaveProperty(key);
      expect(germanTranslations.search).toHaveProperty(key);
    });
  });

  test('should have required error messages', () => {
    const errorKeys = ['general_error', 'network_error', 'search_failed'];
    
    errorKeys.forEach(key => {
      expect(englishTranslations.errors).toHaveProperty(key);
      expect(germanTranslations.errors).toHaveProperty(key);
    });
  });

  test('should use English as default language (from config)', () => {
    const config = require('../../src/utils/config');
    expect(config.getDefaultLanguage()).toBe('en');
  });

  test('should have placeholder support in search messages', () => {
    expect(englishTranslations.search.no_players_found).toContain('{query}');
    expect(germanTranslations.search.no_players_found).toContain('{query}');
    
    expect(englishTranslations.search.found_players).toContain('{count}');
    expect(germanTranslations.search.found_players).toContain('{count}');
  });
});
