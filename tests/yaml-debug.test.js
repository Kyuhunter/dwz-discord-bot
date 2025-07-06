// Use requireActual to bypass fs mocking for this test
const fs = jest.requireActual('fs');
const yaml = require('js-yaml');
const path = require('path');

describe('YAML Loading Test', () => {
  test('should load YAML files correctly', () => {
    const enPath = path.join(__dirname, '../translations/en.yaml');
    const dePath = path.join(__dirname, '../translations/de.yaml');
    
    const enContent = fs.readFileSync(enPath, 'utf8');
    const deContent = fs.readFileSync(dePath, 'utf8');
    
    console.log('EN content type:', typeof enContent);
    console.log('EN content length:', enContent.length);
    console.log('EN first 50 chars:', enContent.substring(0, 50));
    
    const englishTranslations = yaml.load(enContent);
    const germanTranslations = yaml.load(deContent);
    
    console.log('Parsed EN type:', typeof englishTranslations);
    console.log('Parsed EN:', englishTranslations);
    console.log('Parsed DE type:', typeof germanTranslations);
    
    expect(typeof englishTranslations).toBe('object');
    expect(typeof germanTranslations).toBe('object');
    expect(englishTranslations).toHaveProperty('commands');
    expect(germanTranslations).toHaveProperty('commands');
  });
});
