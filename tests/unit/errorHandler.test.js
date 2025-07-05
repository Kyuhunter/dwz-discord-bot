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
    describe('logError', () => {
      test('should log error with context', () => {
        const { logger } = require('../../src/utils/logger');
        const error = new Error('Test error');
        const context = { userId: '123', command: 'dwz' };
        
        logError(error, context);
        
        expect(logger.error).toHaveBeenCalledWith(
          'Test error',
          expect.objectContaining({
            error: error.message,
            stack: error.stack,
            context
          })
        );
      });

      test('should log custom error with additional properties', () => {
        const { logger } = require('../../src/utils/logger');
        const error = new ValidationError('Invalid input', 'playerName');
        
        logError(error);
        
        expect(logger.error).toHaveBeenCalledWith(
          'Invalid input',
          expect.objectContaining({
            errorType: 'ValidationError',
            code: 'VALIDATION_ERROR',
            field: 'playerName'
          })
        );
      });

      test('should handle null error gracefully', () => {
        const { logger } = require('../../src/utils/logger');
        
        logError(null);
        
        expect(logger.error).toHaveBeenCalledWith(
          'Unknown error occurred',
          expect.any(Object)
        );
      });
    });

    describe('handleError', () => {
      test('should return error response object', () => {
        const error = new Error('Test error');
        
        const result = handleError(error);
        
        expect(result).toHaveProperty('success', false);
        expect(result).toHaveProperty('error');
        expect(result).toHaveProperty('errorType');
      });

      test('should handle custom errors', () => {
        const error = new ValidationError('Invalid input', 'playerName');
        
        const result = handleError(error);
        
        expect(result.errorType).toBe('ValidationError');
        expect(result.error).toContain('Invalid input');
      });

      test('should handle unknown errors', () => {
        const error = new Error('Unknown error');
        
        const result = handleError(error);
        
        expect(result.errorType).toBe('Error');
      });
    });

    describe('handleInteractionError', () => {
      test('should handle interaction errors with reply', async () => {
        const mockInteraction = {
          replied: false,
          deferred: false,
          reply: jest.fn().mockResolvedValue()
        };
        const error = new Error('Interaction error');
        
        await handleInteractionError(mockInteraction, error);
        
        expect(mockInteraction.reply).toHaveBeenCalledWith(
          expect.objectContaining({
            embeds: expect.any(Array),
            ephemeral: true
          })
        );
      });

      test('should handle interaction errors with editReply when deferred', async () => {
        const mockInteraction = {
          replied: false,
          deferred: true,
          editReply: jest.fn().mockResolvedValue()
        };
        const error = new Error('Deferred interaction error');
        
        await handleInteractionError(mockInteraction, error);
        
        expect(mockInteraction.editReply).toHaveBeenCalled();
      });

      test('should handle interaction errors with followUp when already replied', async () => {
        const mockInteraction = {
          replied: true,
          deferred: false,
          followUp: jest.fn().mockResolvedValue()
        };
        const error = new Error('Follow up error');
        
        await handleInteractionError(mockInteraction, error);
        
        expect(mockInteraction.followUp).toHaveBeenCalled();
      });

      test('should handle errors in error handling gracefully', async () => {
        const mockInteraction = {
          replied: false,
          deferred: false,
          reply: jest.fn().mockRejectedValue(new Error('Reply failed'))
        };
        const error = new Error('Original error');
        
        // Should not throw even if reply fails
        await expect(handleInteractionError(mockInteraction, error)).resolves.not.toThrow();
      });
    });

    describe('handleCommandError', () => {
      test('should handle command execution errors', async () => {
        const mockInteraction = {
          replied: false,
          deferred: false,
          reply: jest.fn().mockResolvedValue(),
          commandName: 'dwz',
          user: { id: '123' }
        };
        const error = new Error('Command error');
        
        await handleCommandError(mockInteraction, error);
        
        expect(mockInteraction.reply).toHaveBeenCalled();
      });

      test('should include command context in error logging', async () => {
        const { logger } = require('../../src/utils/logger');
        const mockInteraction = {
          replied: false,
          deferred: false,
          reply: jest.fn().mockResolvedValue(),
          commandName: 'dwz',
          user: { id: '123' }
        };
        const error = new Error('Command error');
        
        await handleCommandError(mockInteraction, error);
        
        expect(logger.error).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            command: 'dwz',
            userId: '123'
          })
        );
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
