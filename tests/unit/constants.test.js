/**
 * Unit Tests for Constants Module
 */

const constants = require('../../src/constants');

describe('Constants Module', () => {
  test('should be immutable (frozen)', () => {
    expect(Object.isFrozen(constants)).toBe(true);
    expect(Object.isFrozen(constants.SUCCESS_MESSAGES)).toBe(true);
    expect(Object.isFrozen(constants.ERROR_MESSAGES)).toBe(true);
  });

  describe('SUCCESS_MESSAGES', () => {
    test('should have all required success messages', () => {
      expect(constants.SUCCESS_MESSAGES).toHaveProperty('BOT_READY');
      expect(constants.SUCCESS_MESSAGES).toHaveProperty('COMMAND_EXECUTED');
      expect(constants.SUCCESS_MESSAGES).toHaveProperty('DWZ_SEARCH_SUCCESS');
      
      expect(typeof constants.SUCCESS_MESSAGES.BOT_READY).toBe('string');
      expect(typeof constants.SUCCESS_MESSAGES.COMMAND_EXECUTED).toBe('string');
      expect(typeof constants.SUCCESS_MESSAGES.DWZ_SEARCH_SUCCESS).toBe('string');
    });
  });

  describe('ERROR_MESSAGES', () => {
    test('should have all required error messages', () => {
      expect(constants.ERROR_MESSAGES).toHaveProperty('GENERAL_ERROR');
      expect(constants.ERROR_MESSAGES).toHaveProperty('NETWORK_ERROR');
      expect(constants.ERROR_MESSAGES).toHaveProperty('INVALID_TOKEN');
      expect(constants.ERROR_MESSAGES).toHaveProperty('DWZ_SEARCH_FAILED');
      expect(constants.ERROR_MESSAGES).toHaveProperty('NO_PLAYERS_FOUND');
      expect(constants.ERROR_MESSAGES).toHaveProperty('TIMEOUT_ERROR');
      expect(constants.ERROR_MESSAGES).toHaveProperty('CONNECTION_ERROR');
      
      expect(typeof constants.ERROR_MESSAGES.GENERAL_ERROR).toBe('string');
      expect(typeof constants.ERROR_MESSAGES.NETWORK_ERROR).toBe('string');
    });
  });

  describe('DWZ_CONFIG', () => {
    test('should have valid DWZ configuration', () => {
      expect(constants.DWZ_CONFIG).toHaveProperty('BASE_URL');
      expect(constants.DWZ_CONFIG).toHaveProperty('SEARCH_PATH');
      expect(constants.DWZ_CONFIG).toHaveProperty('TIMEOUT');
      expect(constants.DWZ_CONFIG).toHaveProperty('MAX_RESULTS');
      
      expect(typeof constants.DWZ_CONFIG.BASE_URL).toBe('string');
      expect(constants.DWZ_CONFIG.BASE_URL).toMatch(/^https?:\/\//);
      
      expect(typeof constants.DWZ_CONFIG.SEARCH_PATH).toBe('string');
      expect(constants.DWZ_CONFIG.SEARCH_PATH).toMatch(/^\//);
      
      expect(typeof constants.DWZ_CONFIG.TIMEOUT).toBe('number');
      expect(constants.DWZ_CONFIG.TIMEOUT).toBeGreaterThan(0);
      
      expect(typeof constants.DWZ_CONFIG.MAX_RESULTS).toBe('number');
      expect(constants.DWZ_CONFIG.MAX_RESULTS).toBeGreaterThan(0);
    });
  });

  describe('EMBED_COLORS', () => {
    test('should have valid color hex codes', () => {
      expect(constants.EMBED_COLORS).toHaveProperty('SUCCESS');
      expect(constants.EMBED_COLORS).toHaveProperty('ERROR');
      expect(constants.EMBED_COLORS).toHaveProperty('WARNING');
      expect(constants.EMBED_COLORS).toHaveProperty('INFO');
      
      // Test hex color format (numbers)
      Object.values(constants.EMBED_COLORS).forEach(color => {
        expect(typeof color).toBe('number');
        expect(color).toBeGreaterThanOrEqual(0x000000);
        expect(color).toBeLessThanOrEqual(0xFFFFFF);
      });
    });
  });

  describe('CHART_CONFIG', () => {
    test('should have valid chart configuration', () => {
      expect(constants.CHART_CONFIG).toHaveProperty('WIDTH');
      expect(constants.CHART_CONFIG).toHaveProperty('HEIGHT');
      expect(constants.CHART_CONFIG).toHaveProperty('BACKGROUND_COLOR');
      
      expect(typeof constants.CHART_CONFIG.WIDTH).toBe('number');
      expect(constants.CHART_CONFIG.WIDTH).toBeGreaterThan(0);
      
      expect(typeof constants.CHART_CONFIG.HEIGHT).toBe('number');
      expect(constants.CHART_CONFIG.HEIGHT).toBeGreaterThan(0);
    });
  });

  describe('LOG_LEVELS', () => {
    test('should have all standard log levels', () => {
      expect(constants.LOG_LEVELS).toHaveProperty('ERROR');
      expect(constants.LOG_LEVELS).toHaveProperty('WARN');
      expect(constants.LOG_LEVELS).toHaveProperty('INFO');
      expect(constants.LOG_LEVELS).toHaveProperty('DEBUG');
      
      expect(typeof constants.LOG_LEVELS.ERROR).toBe('number');
      expect(typeof constants.LOG_LEVELS.WARN).toBe('number');
      expect(typeof constants.LOG_LEVELS.INFO).toBe('number');
      expect(typeof constants.LOG_LEVELS.DEBUG).toBe('number');
    });
  });

  describe('RATE_LIMITS', () => {
    test('should have valid rate limit configuration', () => {
      expect(constants.RATE_LIMITS).toHaveProperty('DWZ_SEARCH');
      expect(constants.RATE_LIMITS.DWZ_SEARCH).toHaveProperty('REQUESTS');
      expect(constants.RATE_LIMITS.DWZ_SEARCH).toHaveProperty('WINDOW');
      
      expect(typeof constants.RATE_LIMITS.DWZ_SEARCH.REQUESTS).toBe('number');
      expect(constants.RATE_LIMITS.DWZ_SEARCH.REQUESTS).toBeGreaterThan(0);
      
      expect(typeof constants.RATE_LIMITS.DWZ_SEARCH.WINDOW).toBe('number');
      expect(constants.RATE_LIMITS.DWZ_SEARCH.WINDOW).toBeGreaterThan(0);
    });
  });

  describe('REGEX_PATTERNS', () => {
    test('should have valid regex patterns', () => {
      expect(constants.REGEX_PATTERNS).toHaveProperty('DWZ_NUMBER');
      expect(constants.REGEX_PATTERNS).toHaveProperty('DATE_FORMAT');
      
      expect(constants.REGEX_PATTERNS.DWZ_NUMBER).toBeInstanceOf(RegExp);
      expect(constants.REGEX_PATTERNS.DATE_FORMAT).toBeInstanceOf(RegExp);
      
      // Test DWZ number pattern
      expect('1500').toMatch(constants.REGEX_PATTERNS.DWZ_NUMBER);
      expect('abc').not.toMatch(constants.REGEX_PATTERNS.DWZ_NUMBER);
    });
  });
});
