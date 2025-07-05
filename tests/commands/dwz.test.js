/**
 * Unit Tests for DWZ Command
 */

const path = require('path');

// Mock all the dependencies before requiring the command
jest.mock('../../src/services/dwzSearchService', () => {
  return jest.fn().mockImplementation(() => ({
    searchPlayer: jest.fn()
  }));
});

jest.mock('../../src/services/embedService', () => {
  return jest.fn().mockImplementation(() => ({
    createErrorEmbed: jest.fn(),
    createPlayerDetailsEmbed: jest.fn(),
    createMultiplePlayersEmbed: jest.fn(),
    createNoPlayersFoundEmbed: jest.fn()
  }));
});

jest.mock('../../src/utils/logger', () => ({
  logger: {
    logCommandExecution: jest.fn(),
    error: jest.fn()
  }
}));

jest.mock('../../src/validators', () => ({
  validatePlayerName: jest.fn(),
  validateClubName: jest.fn()
}));

describe('DWZ Command', () => {
  let dwzCommand;
  let mockInteraction;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Require the command after all mocks are set up
    dwzCommand = require('../../src/commands/dwz');
    
    mockInteraction = {
      reply: jest.fn().mockResolvedValue(),
      editReply: jest.fn().mockResolvedValue(),
      deferReply: jest.fn().mockResolvedValue(),
      options: {
        getString: jest.fn()
      },
      user: {
        id: '123456789',
        username: 'testuser'
      },
      guild: {
        id: '987654321',
        name: 'Test Guild'
      }
    };
  });

  describe('Command Structure', () => {
    test('should have correct command data', () => {
      expect(dwzCommand).toHaveProperty('data');
      expect(dwzCommand.data).toHaveProperty('name', 'dwz');
      expect(dwzCommand.data).toHaveProperty('description');
      expect(dwzCommand.data.description).toBeTruthy();
    });

    test('should have execute function', () => {
      expect(dwzCommand).toHaveProperty('execute');
      expect(typeof dwzCommand.execute).toBe('function');
    });

    test('should have correct options', () => {
      const options = dwzCommand.data.options;
      expect(Array.isArray(options)).toBe(true);
      expect(options.length).toBeGreaterThan(0);
      
      const nameOption = options.find(opt => opt.name === 'name');
      expect(nameOption).toBeDefined();
      expect(nameOption.required).toBe(true);
    });
  });

  describe('Command Execution', () => {
    test('should execute without throwing errors', async () => {
      mockInteraction.options.getString.mockReturnValue('Hans Müller');
      
      // Mock validators
      const { validatePlayerName } = require('../../src/validators');
      validatePlayerName.mockReturnValue({ isValid: true });

      await expect(dwzCommand.execute(mockInteraction)).resolves.not.toThrow();
      
      expect(mockInteraction.deferReply).toHaveBeenCalled();
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('name');
    });

    test('should handle empty player name', async () => {
      mockInteraction.options.getString.mockReturnValue('');

      await expect(dwzCommand.execute(mockInteraction)).resolves.not.toThrow();
      
      expect(mockInteraction.deferReply).toHaveBeenCalled();
    });

    test('should handle null player name', async () => {
      mockInteraction.options.getString.mockReturnValue(null);

      await expect(dwzCommand.execute(mockInteraction)).resolves.not.toThrow();
      
      expect(mockInteraction.deferReply).toHaveBeenCalled();
    });

    test('should call logger for command execution', async () => {
      const { logger } = require('../../src/utils/logger');
      mockInteraction.options.getString.mockReturnValue('Test Player');

      await dwzCommand.execute(mockInteraction);

      expect(logger.logCommandExecution).toHaveBeenCalledWith(
        'dwz',
        '123456789',
        expect.any(Object)
      );
    });
  });

  describe('Input Handling', () => {
    test('should handle club parameter', async () => {
      mockInteraction.options.getString
        .mockReturnValueOnce('Hans Müller') // for 'name'
        .mockReturnValueOnce('SC Berlin');  // for 'club'

      await dwzCommand.execute(mockInteraction);

      expect(mockInteraction.options.getString).toHaveBeenCalledWith('name');
      expect(mockInteraction.options.getString).toHaveBeenCalledWith('club');
    });

    test('should handle missing club parameter', async () => {
      mockInteraction.options.getString
        .mockReturnValueOnce('Hans Müller') // for 'name'
        .mockReturnValueOnce(null);         // for 'club'

      await expect(dwzCommand.execute(mockInteraction)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle service initialization errors', async () => {
      mockInteraction.options.getString.mockReturnValue('Test Player');
      
      // Mock the constructor to throw an error
      const DWZSearchService = require('../../src/services/dwzSearchService');
      DWZSearchService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      await expect(dwzCommand.execute(mockInteraction)).resolves.not.toThrow();
    });
  });

  describe('Integration with Services', () => {
    test('should interact with search service', async () => {
      mockInteraction.options.getString.mockReturnValue('Hans Müller');
      
      const { validatePlayerName } = require('../../src/validators');
      validatePlayerName.mockReturnValue({ isValid: true });

      await dwzCommand.execute(mockInteraction);

      // The command should create service instances
      const DWZSearchService = require('../../src/services/dwzSearchService');
      expect(DWZSearchService).toHaveBeenCalled();
    });

    test('should interact with embed service', async () => {
      mockInteraction.options.getString.mockReturnValue('Hans Müller');

      await dwzCommand.execute(mockInteraction);

      // The command should create embed service instance
      const EmbedService = require('../../src/services/embedService');
      expect(EmbedService).toHaveBeenCalled();
    });
  });
});
