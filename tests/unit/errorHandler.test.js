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
  withErrorHandling,
  safeExecute
} = require('../../src/helpers/errorHandler');

const { categorizeError, createUserFriendlyError } = require('../../src/helpers/errors/categorizer');

// Get the real categorizeError function for testing
const realCategorizeError = jest.requireActual('../../src/helpers/errors/categorizer').categorizeError;

const { 
  handleError: handlerHandleError, 
  withErrorHandling: handlerWithErrorHandling, 
  safeExecute: handlerSafeExecute 
} = require('../../src/helpers/errors/handler');

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

// Mock the categorizer module for handler tests only
jest.mock('../../src/helpers/errors/categorizer', () => ({
  categorizeError: jest.fn(),
  createUserFriendlyError: jest.requireActual('../../src/helpers/errors/categorizer').createUserFriendlyError
}));

describe('Error Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Handler Module Functions', () => {
    describe('handlerHandleError', () => {
      test('should handle error and sanitize sensitive data', () => {
        const { logger } = require('../../src/utils/logger');
        
        const mockError = new Error('Test error with password: secret123 and secretKey');
        const mockCategorized = {
          message: 'Test error with password: secret123 and secretKey',
          code: 'TEST_ERROR',
          name: 'TestError'
        };
        
        categorizeError.mockReturnValue(mockCategorized);
        
        const result = handlerHandleError(mockError, { userId: '123' });
        
        expect(result).toEqual({
          message: 'Test error with password: secret123 and secretKey',
          code: 'TEST_ERROR',
          type: 'Error',
          errorType: 'TestError',
          error: 'Test error with password: [REDACTED] and [REDACTED]',
          timestamp: expect.any(String),
          context: { userId: '123' }
        });
        
        expect(logger.error).toHaveBeenCalledWith(
          'Error: Test error with password: secret123 and secretKey',
          expect.objectContaining({
            code: 'TEST_ERROR',
            context: { userId: '123' },
            stack: expect.any(String)
          })
        );
      });

      test('should handle error without categorization code', () => {
        const mockError = new Error('Simple error');
        mockError.code = 'SIMPLE_CODE';
        mockError.name = 'SimpleError';
        
        const mockCategorized = {
          message: 'Simple error',
          name: 'CategorizedError'
        };
        
        categorizeError.mockReturnValue(mockCategorized);
        
        const result = handlerHandleError(mockError);
        
        expect(result).toEqual({
          message: 'Simple error',
          code: 'SIMPLE_CODE',
          type: 'SimpleError',
          errorType: 'CategorizedError',
          error: 'Simple error',
          timestamp: expect.any(String),
          context: {}
        });
      });

      test('should handle error without error code', () => {
        const mockError = new Error('Error without code');
        const mockCategorized = {
          message: 'Error without code',
          name: 'UnknownError'
        };
        
        categorizeError.mockReturnValue(mockCategorized);
        
        const result = handlerHandleError(mockError);
        
        expect(result.code).toBe('UNKNOWN_ERROR');
      });
    });

    describe('handlerWithErrorHandling', () => {
      test('should execute function normally when no error occurs', async () => {
        const mockFn = jest.fn().mockResolvedValue('success');
        const wrappedFn = handlerWithErrorHandling(mockFn, 'test-operation');
        
        const result = await wrappedFn('arg1', 'arg2');
        
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      });

      test('should handle errors and categorize them', async () => {
        const mockError = new Error('Function failed');
        const mockFn = jest.fn().mockRejectedValue(mockError);
        
        const categorizedError = new Error('Categorized error');
        categorizedError.code = 'CATEGORIZED_ERROR';
        categorizeError.mockReturnValue(categorizedError);
        
        const wrappedFn = handlerWithErrorHandling(mockFn, 'test-operation');
        
        await expect(wrappedFn('arg1', 'arg2')).rejects.toThrow('Categorized error');
        
        expect(categorizeError).toHaveBeenCalledWith(mockError, 'test-operation');
        expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      });

      test('should use default operation name when not provided', async () => {
        const mockError = new Error('Function failed');
        const mockFn = jest.fn().mockRejectedValue(mockError);
        
        const categorizedError = new Error('Categorized error');
        categorizeError.mockReturnValue(categorizedError);
        
        const wrappedFn = handlerWithErrorHandling(mockFn);
        
        await expect(wrappedFn()).rejects.toThrow('Categorized error');
        
        expect(categorizeError).toHaveBeenCalledWith(mockError, 'unknown');
      });
    });

    describe('handlerSafeExecute', () => {
      test('should execute function normally when no error occurs', async () => {
        const mockFn = jest.fn().mockResolvedValue('success');
        const safeFn = handlerSafeExecute(mockFn, 'fallback', 'test-operation');
        
        const result = await safeFn('arg1', 'arg2');
        
        expect(result).toBe('success');
        expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      });

      test('should return fallback value when error occurs', async () => {
        const mockError = new Error('Function failed');
        const mockFn = jest.fn().mockRejectedValue(mockError);
        
        const categorizedError = new Error('Categorized error');
        categorizeError.mockReturnValue(categorizedError);
        
        const safeFn = handlerSafeExecute(mockFn, 'fallback-value', 'test-operation');
        
        const result = await safeFn('arg1', 'arg2');
        
        expect(result).toBe('fallback-value');
        expect(categorizeError).toHaveBeenCalledWith(mockError, 'test-operation');
        expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
      });

      test('should return null fallback when not provided', async () => {
        const mockError = new Error('Function failed');
        const mockFn = jest.fn().mockRejectedValue(mockError);
        
        const categorizedError = new Error('Categorized error');
        categorizeError.mockReturnValue(categorizedError);
        
        const safeFn = handlerSafeExecute(mockFn);
        
        const result = await safeFn();
        
        expect(result).toBeNull();
      });

      test('should use default operation name when not provided', async () => {
        const mockError = new Error('Function failed');
        const mockFn = jest.fn().mockRejectedValue(mockError);
        
        const categorizedError = new Error('Categorized error');
        categorizeError.mockReturnValue(categorizedError);
        
        const safeFn = handlerSafeExecute(mockFn, 'fallback');
        
        await safeFn();
        
        expect(categorizeError).toHaveBeenCalledWith(mockError, 'unknown');
      });
    });
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
      beforeEach(() => {
        // Restore real implementation for these tests
        categorizeError.mockImplementation(realCategorizeError);
      });
      
      afterEach(() => {
        // Reset to mock for other tests
        categorizeError.mockReset();
      });
      
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
    beforeEach(() => {
      // Reset mock before these tests
      categorizeError.mockReset();
    });
    
    test('should classify axios errors as network errors', () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 404 },
        message: 'Request failed'
      };
      
      // Mock categorizeError to return a NetworkError-like object
      categorizeError.mockReturnValue({
        message: 'Request failed',
        name: 'NetworkError',
        code: 'NETWORK_ERROR'
      });
      
      const result = handleError(axiosError);
      
      expect(result.errorType).toBe('NetworkError');
    });

    test('should classify timeout errors appropriately', () => {
      const timeoutError = {
        code: 'ECONNABORTED',
        message: 'timeout exceeded'
      };
      
      // Mock categorizeError to return a timeout error
      categorizeError.mockReturnValue({
        message: 'timeout exceeded',
        name: 'NetworkError',
        code: 'TIMEOUT_ERROR'
      });
      
      const result = handleError(timeoutError);
      
      expect(result.error).toContain('timeout');
    });
  });

  describe('Error Sanitization', () => {
    beforeEach(() => {
      // Reset mock before these tests
      categorizeError.mockReset();
    });
    
    test('should sanitize sensitive information from errors', () => {
      const errorWithSensitiveInfo = new Error('Database password: secret123');
      
      // Mock categorizeError to return the error
      categorizeError.mockReturnValue({
        message: 'Database password: secret123',
        name: 'Error',
        code: 'UNKNOWN_ERROR'
      });
      
      const result = handleError(errorWithSensitiveInfo);
      
      // Should not expose sensitive information
      expect(result.error).not.toContain('secret123');
    });

    test('should preserve important error details', () => {
      const detailedError = new ValidationError('Field "playerName" is required', 'playerName');
      
      // Mock categorizeError to return the validation error
      categorizeError.mockReturnValue({
        message: 'Field "playerName" is required',
        name: 'ValidationError',
        code: 'VALIDATION_ERROR'
      });
      
      const result = handleError(detailedError);
      
      expect(result.error).toContain('playerName');
    });
  });
});
