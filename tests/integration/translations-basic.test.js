/**
 * Basic Translation Tests
 */

// Use requireActual to bypass fs mocking for this test
const fs = jest.requireActual('fs');
const yaml = require('js-yaml');
const path = require('path');

describe('Translation System Basic', () => {
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
      console.log('Error loading translations:', error.message);
      englishTranslations = null;
      germanTranslations = null;
    }
  });

  test('should load YAML files correctly', () => {
    expect(englishTranslations).toBeTruthy();
    expect(germanTranslations).toBeTruthy();
    expect(typeof englishTranslations).toBe('object');
    expect(typeof germanTranslations).toBe('object');
  });

  test('should have required sections', () => {
    if (!englishTranslations || !germanTranslations) {
      console.log('Skipping test - translations not loaded');
      return;
    }

    const requiredSections = ['commands', 'search', 'player', 'tournaments', 'errors', 'status', 'common'];
    
    requiredSections.forEach(section => {
      expect(englishTranslations).toHaveProperty(section);
      expect(germanTranslations).toHaveProperty(section);
    });
  });

  test('should have error keys', () => {
    if (!englishTranslations || !germanTranslations) {
      console.log('Skipping test - translations not loaded');
      return;
    }

    const requiredErrorKeys = ['general_error', 'network_error', 'search_failed', 'invalid_input', 'rate_limited'];
    
    requiredErrorKeys.forEach(key => {
      expect(englishTranslations.errors).toHaveProperty(key);
      expect(germanTranslations.errors).toHaveProperty(key);
    });
  });
});
