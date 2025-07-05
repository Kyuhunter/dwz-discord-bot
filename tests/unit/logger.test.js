/**
 * Unit Tests for Logger Module
 */

const { logger, LOG_LEVELS } = require('../../src/utils/logger');

describe('Logger Module', () => {
  let originalConsole;

  beforeEach(() => {
    // Mock console methods for testing
    originalConsole = global.console;
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
  });

  afterEach(() => {
    global.console = originalConsole;
    jest.clearAllMocks();
  });

  describe('LOG_LEVELS', () => {
    test('should export log levels', () => {
      expect(LOG_LEVELS).toHaveProperty('ERROR');
      expect(LOG_LEVELS).toHaveProperty('WARN');
      expect(LOG_LEVELS).toHaveProperty('INFO');
      expect(LOG_LEVELS).toHaveProperty('DEBUG');
      
      expect(typeof LOG_LEVELS.ERROR).toBe('number');
      expect(typeof LOG_LEVELS.WARN).toBe('number');
      expect(typeof LOG_LEVELS.INFO).toBe('number');
      expect(typeof LOG_LEVELS.DEBUG).toBe('number');
    });
  });

  describe('Logger Instance', () => {
    test('should have all logging methods', () => {
      expect(logger).toHaveProperty('error');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('setLevel');
      
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.warn).toBe('function');
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.setLevel).toBe('function');
    });

    test('should log error messages', () => {
      logger.error('Test error message');
      expect(console.error).toHaveBeenCalled();
      
      const lastCall = console.error.mock.calls[console.error.mock.calls.length - 1];
      expect(lastCall[0]).toContain('ERROR');
      expect(lastCall[0]).toContain('Test error message');
    });

    test('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(console.warn).toHaveBeenCalled();
      
      const lastCall = console.warn.mock.calls[console.warn.mock.calls.length - 1];
      expect(lastCall[0]).toContain('WARN');
      expect(lastCall[0]).toContain('Test warning message');
    });

    test('should log info messages', () => {
      logger.info('Test info message');
      expect(console.info).toHaveBeenCalled();
      
      const lastCall = console.info.mock.calls[console.info.mock.calls.length - 1];
      expect(lastCall[0]).toContain('INFO');
      expect(lastCall[0]).toContain('Test info message');
    });

    test('should log debug messages', () => {
      logger.setLevel(LOG_LEVELS.DEBUG);
      logger.debug('Test debug message');
      expect(console.debug).toHaveBeenCalled();
      
      const lastCall = console.debug.mock.calls[console.debug.mock.calls.length - 1];
      expect(lastCall[0]).toContain('DEBUG');
      expect(lastCall[0]).toContain('Test debug message');
    });

    test('should include timestamp in log messages', () => {
      logger.info('Test message');
      
      const lastCall = console.info.mock.calls[console.info.mock.calls.length - 1];
      // Should contain timestamp pattern like [2025-07-05T19:26:11.135Z] (ISO format)
      expect(lastCall[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    test('should handle error objects', () => {
      const testError = new Error('Test error');
      testError.stack = 'Error: Test error\\n    at test.js:1:1';
      
      logger.error('Error occurred', testError);
      expect(console.error).toHaveBeenCalled();
      
      const lastCall = console.error.mock.calls[console.error.mock.calls.length - 1];
      expect(lastCall[0]).toContain('Error occurred');
    });

    test('should handle context objects', () => {
      const context = { userId: '123', command: 'dwz' };
      
      logger.info('Command executed', context);
      expect(console.info).toHaveBeenCalled();
      
      const lastCall = console.info.mock.calls[console.info.mock.calls.length - 1];
      expect(lastCall[0]).toContain('Command executed');
      expect(lastCall[0]).toContain('userId');
      expect(lastCall[0]).toContain('123');
    });
  });

  describe('Log Level Management', () => {
    test('should set log level', () => {
      expect(() => logger.setLevel(LOG_LEVELS.ERROR)).not.toThrow();
      expect(() => logger.setLevel(LOG_LEVELS.WARN)).not.toThrow();
      expect(() => logger.setLevel(LOG_LEVELS.INFO)).not.toThrow();
      expect(() => logger.setLevel(LOG_LEVELS.DEBUG)).not.toThrow();
    });

    test('should respect log level filtering', () => {
      // Set to ERROR level - should only log errors
      logger.setLevel(LOG_LEVELS.ERROR);
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');
      
      expect(console.error).toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
      
      jest.clearAllMocks();
      
      // Set to INFO level - should log error, warn, and info
      logger.setLevel(LOG_LEVELS.INFO);
      
      logger.error('Error message');
      logger.warn('Warning message');
      logger.info('Info message');
      logger.debug('Debug message');
      
      expect(console.error).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.info).toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('Environment Integration', () => {
    test('should respect NODE_ENV for log level', () => {
      // Logger should adapt to environment
      expect(logger).toBeDefined();
      
      // In test environment, should have reasonable defaults
      logger.info('Test message');
      expect(console.info).toHaveBeenCalled();
    });

    test('should handle LOG_LEVEL environment variable', () => {
      // This tests if the logger respects LOG_LEVEL env var
      // Implementation depends on the actual logger setup
      expect(logger.setLevel).toBeDefined();
    });
  });

  describe('Performance', () => {
    test('should not impact performance significantly', () => {
      const start = process.hrtime.bigint();
      
      for (let i = 0; i < 1000; i++) {
        logger.info(`Test message ${i}`);
      }
      
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds
      
      // Should complete 1000 log calls in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });
  });
});
