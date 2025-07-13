/**
 * Integration Tests for Bot Components
 */

const path = require('path');
const fs = require('fs');

describe('Bot Integration', () => {
  describe('File Structure', () => {
    test('should have all required source files', () => {
      const requiredFiles = [
        'src/constants/index.js',
        'src/validators/index.js',
        'src/utils/logger.js',
        'src/services/dwzInfoService.js',
        'src/services/embedService.js',
        'src/commands/dwz.js'
      ];

      requiredFiles.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });

    test('should have configuration files', () => {
      const configFiles = [
        'config.yaml',
        'translations/en.yaml',
        'translations/de.yaml'
      ];

      configFiles.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });

    test('should have test files', () => {
      const testFiles = [
        'tests/unit/constants.test.js',
        'tests/unit/validators.test.js',
        'tests/unit/logger.test.js',
        'tests/unit/dwzInfoService.test.js'
      ];

      testFiles.forEach(filePath => {
        const fullPath = path.join(process.cwd(), filePath);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });

  describe('Module Loading', () => {
    test('should load constants module', () => {
      const constants = require('../../src/constants');
      expect(constants).toBeDefined();
      expect(constants).toHaveProperty('ERROR_MESSAGES');
      expect(constants).toHaveProperty('EMBED_COLORS');
      expect(constants).toHaveProperty('DWZ_CONFIG');
    });

    test('should load validators module', () => {
      const validators = require('../../src/validators');
      expect(validators).toBeDefined();
      expect(typeof validators.validatePlayerName).toBe('function');
      expect(typeof validators.sanitizeSearchInput).toBe('function');
    });

    test('should load logger module', () => {
      const { logger } = require('../../src/utils/logger');
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
    });

    test('should load DWZ info service', () => {
      const DWZInfoService = require('../../src/services/dwzInfoService');
      expect(DWZInfoService).toBeDefined();
      expect(typeof DWZInfoService).toBe('function');
      
      // Should be able to instantiate
      const service = new DWZInfoService();
      expect(service).toBeDefined();
    });

    test('should load embed service', () => {
      const EmbedService = require('../../src/services/embedService');
      expect(EmbedService).toBeDefined();
      expect(typeof EmbedService).toBe('function');
    });

    test('should load DWZ command', () => {
      const dwzCommand = require('../../src/commands/dwz');
      expect(dwzCommand).toBeDefined();
      expect(dwzCommand).toHaveProperty('data');
      expect(dwzCommand).toHaveProperty('execute');
      expect(typeof dwzCommand.execute).toBe('function');
    });
  });

  describe('Configuration Validation', () => {
    test('should have valid package.json', () => {
      const packagePath = path.join(process.cwd(), 'package.json');
      expect(fs.existsSync(packagePath)).toBe(true);
      
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      expect(packageData.name).toBeDefined();
      expect(packageData.version).toBeDefined();
      expect(packageData.scripts).toHaveProperty('test');
    });

    test('should have valid Jest configuration', () => {
      const jestConfigPath = path.join(process.cwd(), 'jest.config.js');
      expect(fs.existsSync(jestConfigPath)).toBe(true);
      
      const jestConfig = require('../../jest.config.js');
      expect(jestConfig).toBeDefined();
      expect(jestConfig).toHaveProperty('collectCoverage');
      expect(jestConfig).toHaveProperty('coverageThreshold');
    });
  });

  describe('Translation Files', () => {
    test('should have readable English translations', () => {
      const enPath = path.join(process.cwd(), 'translations/en.yaml');
      expect(fs.existsSync(enPath)).toBe(true);
      
      const content = fs.readFileSync(enPath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('commands:');
    });

    test('should have readable German translations', () => {
      const dePath = path.join(process.cwd(), 'translations/de.yaml');
      expect(fs.existsSync(dePath)).toBe(true);
      
      const content = fs.readFileSync(dePath, 'utf8');
      expect(content).toBeTruthy();
      expect(content.length).toBeGreaterThan(100);
      expect(content).toContain('commands:');
    });
  });

  describe('Module Dependencies', () => {
    test('should have all constants available', () => {
      const constants = require('../../src/constants');
      
      // Check that main constant groups exist
      expect(constants.ERROR_MESSAGES).toBeDefined();
      expect(constants.SUCCESS_MESSAGES).toBeDefined();
      expect(constants.EMBED_COLORS).toBeDefined();
      expect(constants.DWZ_CONFIG).toBeDefined();
      expect(constants.LIMITS).toBeDefined();
    });

    test('should have all validator functions available', () => {
      const validators = require('../../src/validators');
      
      const expectedFunctions = [
        'validatePlayerName',
        'validateDWZRating',
        'validateClubName',
        'sanitizeSearchInput',
        'validateSearchQuery',
        'validatePlayerData'
      ];

      expectedFunctions.forEach(funcName => {
        expect(typeof validators[funcName]).toBe('function');
      });
    });

    test('should have logger with all methods', () => {
      const { logger } = require('../../src/utils/logger');
      
      const expectedMethods = ['error', 'warn', 'info', 'debug'];
      expectedMethods.forEach(method => {
        expect(typeof logger[method]).toBe('function');
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle missing files gracefully', () => {
      // Test that modules can handle missing dependencies
      expect(() => {
        require('../../src/constants');
      }).not.toThrow();
    });

    test('should handle module loading errors', () => {
      // Most modules should not throw during import
      expect(() => {
        require('../../src/validators');
        require('../../src/utils/logger');
      }).not.toThrow();
    });
  });

  describe('Test Coverage', () => {
    test('should have tests for main modules', () => {
      const testFiles = [
        'tests/unit/constants.test.js',
        'tests/unit/validators.test.js',
        'tests/unit/logger.test.js',
        'tests/unit/dwzInfoService.test.js',
        'tests/unit/embedService.test.js',
        'tests/unit/config.test.js'
      ];

      testFiles.forEach(testFile => {
        const fullPath = path.join(process.cwd(), testFile);
        expect(fs.existsSync(fullPath)).toBe(true);
      });
    });
  });
});
