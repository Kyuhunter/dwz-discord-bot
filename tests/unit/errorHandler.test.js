/**
 * Unit Tests for Error Handler
 */

const { 
  DWZBotError,
  ValidationError,
  SearchError,
  NetworkError,
  ChartGenerationError,
  handleError,
  categorizeError,
  createUserFriendlyError,
  withErrorHandling,
  safeExecute
} = require('../../src/helpers/errorHandler');

// Mock dependencies
jest.mock('../../src/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn()
  }
}));

jest.mock('../../src/constants', () => ({
  ERROR_MESSAGES: {
    GENERIC: 'An error occurred',
    VALIDATION: 'Invalid input',
    NETWORK: 'Network error',
    SEARCH: 'Search failed'
  }
}));

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Custom Error Classes', () => {
    describe('DWZBotError', () => {
      test('should create error with message and code', () => {
        const error = new DWZBotError('Test error', 'TEST_CODE');
        
        expect(error.message).toBe('Test error');
        expect(error.code).toBe('TEST_CODE');
        expect(error.name).toBe('DWZBotError');
        expect(error.timestamp).toBeDefined();
        expect(error.originalError).toBeNull();
      });

      test('should create error with original error', () => {
        const originalError = new Error('Original error');
        const error = new DWZBotError('Wrapped error', 'WRAP_CODE', originalError);
        
        expect(error.originalError).toBe(originalError);
      });

      test('should create error with default code', () => {
        const error = new DWZBotError('Test error');
        
        expect(error.code).toBe('UNKNOWN_ERROR');
      });
    });

    describe('ValidationError', () => {
      test('should create validation error with field', () => {
        const error = new ValidationError('Invalid field', 'playerName');
        
        expect(error.name).toBe('ValidationError');
        expect(error.code).toBe('VALIDATION_ERROR');
        expect(error.field).toBe('playerName');
        expect(error.message).toBe('Invalid field');
      });

      test('should create validation error without field', () => {
        const error = new ValidationError('Invalid input');
        
        expect(error.field).toBeNull();
      });
    });

    describe('SearchError', () => {
      test('should create search error with search type', () => {
        const error = new SearchError('Player not found', 'PLAYER');
        
        expect(error.name).toBe('SearchError');
        expect(error.code).toBe('SEARCH_ERROR');
        expect(error.searchType).toBe('PLAYER');
      });

      test('should create search error with default type', () => {
        const error = new SearchError('Search failed');
        
        expect(error.searchType).toBe('GENERAL');
      });
    });

    describe('NetworkError', () => {
      test('should create network error with status code', () => {
        const error = new NetworkError('HTTP 404', 404);
        
        expect(error.name).toBe('NetworkError');
        expect(error.code).toBe('NETWORK_ERROR');
        expect(error.statusCode).toBe(404);
      });

      test('should create network error without status code', () => {
        const error = new NetworkError('Connection failed');
        
        expect(error.statusCode).toBeNull();
      });
    });

    describe('ChartGenerationError', () => {
      test('should create chart generation error', () => {
        const error = new ChartGenerationError('Chart generation failed');
        
        expect(error.name).toBe('ChartGenerationError');
        expect(error.code).toBe('CHART_GENERATION_ERROR');
      });
    });
  });

  describe('Error Handling Functions', () => {
    describe('handleError', () => {
      test('should log error with context', () => {
        const { logger } = require('../../src/utils/logger');
        const error = new Error('Test error');
        const context = { userId: '123', command: 'dwz' };
        
        const result = handleError(error, context);
        
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('Error: Test error'),
          expect.objectContaining({
            code: 'UNKNOWN_ERROR',
            context,
            stack: error.stack
          })
        );
        expect(result).toHaveProperty('message', 'Test error');
        expect(result).toHaveProperty('code', 'UNKNOWN_ERROR');
        expect(result).toHaveProperty('type', 'Error');
        expect(result).toHaveProperty('context', context);
      });

      test('should log custom error with additional properties', () => {
        const { logger } = require('../../src/utils/logger');
        const error = new ValidationError('Invalid input', 'playerName');
        
        const result = handleError(error);
        
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('ValidationError: Invalid input'),
          expect.objectContaining({
            code: 'VALIDATION_ERROR',
            context: {},
            stack: error.stack
          })
        );
        expect(result).toHaveProperty('type', 'ValidationError');
        expect(result).toHaveProperty('code', 'VALIDATION_ERROR');
        expect(result).toHaveProperty('message', 'Invalid input');
      });

      test('should handle null error gracefully', () => {
        const { logger } = require('../../src/utils/logger');
        
        expect(() => handleError(null)).toThrow();
        // handleError expects an Error object, so passing null should throw
      });
    });

    describe('categorizeError', () => {
      test('should categorize ENOTFOUND as NetworkError', () => {
        const error = { code: 'ENOTFOUND', message: 'Not found' };
        const result = categorizeError(error);
        expect(result).toBeInstanceOf(NetworkError);
      });
      test('should categorize ETIMEDOUT as NetworkError', () => {
        const error = { code: 'ETIMEDOUT', message: 'Timeout' };
        const result = categorizeError(error);
        expect(result).toBeInstanceOf(NetworkError);
      });
      test('should categorize HTTP 404 as SearchError', () => {
        const error = { response: { status: 404 }, message: '404' };
        const result = categorizeError(error);
        expect(result).toBeInstanceOf(SearchError);
      });
      test('should categorize HTTP 500 as NetworkError', () => {
        const error = { response: { status: 500 }, message: '500' };
        const result = categorizeError(error);
        expect(result).toBeInstanceOf(NetworkError);
      });
      test('should categorize chart_generation operation as ChartGenerationError', () => {
        const error = { message: 'Chart error' };
        const result = categorizeError(error, 'chart_generation');
        expect(result).toBeInstanceOf(ChartGenerationError);
      });
      test('should categorize search operation as SearchError', () => {
        const error = { message: 'Search error' };
        const result = categorizeError(error, 'search');
        expect(result).toBeInstanceOf(SearchError);
      });
      test('should categorize validation operation as ValidationError', () => {
        const error = { message: 'Validation error' };
        const result = categorizeError(error, 'validation');
        expect(result).toBeInstanceOf(ValidationError);
      });
      test('should default to DWZBotError', () => {
        const error = { message: 'Other error' };
        const result = categorizeError(error);
        expect(result).toBeInstanceOf(DWZBotError);
      });
    });

    describe('createUserFriendlyError', () => {
      test('should create user-friendly error for ValidationError', () => {
        const error = new ValidationError('Invalid input');
        const result = createUserFriendlyError(error);
        expect(result.title).toBe('Input Validation Error');
        expect(result.description).toBe('Invalid input');
        expect(result.canRetry).toBe(false);
      });
      test('should create user-friendly error for NetworkError', () => {
        const error = new NetworkError('Network down');
        const result = createUserFriendlyError(error);
        expect(result.title).toBe('Connection Error');
        expect(result.canRetry).toBe(true);
      });
      test('should create user-friendly error for SearchError', () => {
        const error = new SearchError('Search failed');
        const result = createUserFriendlyError(error);
        expect(result.title).toBe('Search Error');
        expect(result.canRetry).toBe(true);
      });
      test('should create user-friendly error for ChartGenerationError', () => {
        const error = new ChartGenerationError('Chart failed');
        const result = createUserFriendlyError(error);
        expect(result.title).toBe('Chart Generation Error');
        expect(result.canRetry).toBe(false);
      });
      test('should use default for unknown error', () => {
        const error = new Error('Unknown');
        const result = createUserFriendlyError(error);
        expect(result.title).toBe('Error');
      });
    });
  });

  describe('Error Classification', () => {
    test('should classify axios errors as network errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 404 },
        message: 'Request failed'
      };
      
      const result = handleError(axiosError);
      
      expect(result.errorType).toBe('NetworkError');
    });

    test('should classify timeout errors appropriately', () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout exceeded'
      };
      
      const result = handleError(timeoutError);
      
      expect(result.error).toContain('timeout');
    });
  });

  describe('Error Sanitization', () => {
    test('should sanitize sensitive information from errors', () => {
      const errorWithSensitiveInfo = new Error('Database password: secret123');
      
      const result = handleError(errorWithSensitiveInfo);
      
      // Should not expose sensitive information
      expect(result.error).not.toContain('secret123');
    });

    test('should preserve important error details', () => {
      const detailedError = new ValidationError('Field "playerName" is required', 'playerName');
      
      const result = handleError(detailedError);
      
      expect(result.error).toContain('playerName');
    });
  });
});
