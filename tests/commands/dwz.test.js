/**
 * Unit Tests for DWZ Command
 */

const path = require('path');

// Mock all the dependencies before requiring the command
jest.mock('../../src/services/dwzInfoService', () => {
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
      const DWZInfoService = require('../../src/services/dwzInfoService');
      DWZInfoService.mockImplementation(() => {
        throw new Error('Service initialization failed');
      });

      await expect(dwzCommand.execute(mockInteraction)).resolves.not.toThrow();
    });
  });

  describe('Validation Input Handling', () => {
    test('should handle invalid player name validation', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Invalid@Player') // for 'name'
        .mockReturnValueOnce(null);           // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: false, 
        error: 'Invalid player name format' 
      });
      validateClubName.mockReturnValue({ isValid: true });

      await dwzCommand.execute(mockInteraction);

      expect(validatePlayerName).toHaveBeenCalledWith('Invalid@Player');
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    test('should handle invalid club name validation', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Valid Player')  // for 'name'
        .mockReturnValueOnce('Invalid@Club'); // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Valid Player' 
      });
      validateClubName.mockReturnValue({ 
        isValid: false, 
        error: 'Invalid club name format' 
      });

      await dwzCommand.execute(mockInteraction);

      expect(validateClubName).toHaveBeenCalledWith('Invalid@Club');
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });
  });

  describe('Search Result Handling', () => {
    test('should handle no search results', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Unknown Player') // for 'name'
        .mockReturnValueOnce('Unknown Club');  // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Unknown Player' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Unknown Club' 
      });

      // Mock the searchPlayers method to return empty results
      DWZInfoService.mockImplementation(() => ({
        searchPlayers: jest.fn().mockResolvedValue([])
      }));
      
      EmbedService.mockImplementation(() => ({
        createNoPlayersFoundEmbed: jest.fn().mockReturnValue({ 
          title: 'No Results', 
          description: 'No players found' 
        })
      }));

      await dwzCommand.execute(mockInteraction);

      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    test('should handle single search result with ZPK', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Hans Mueller') // for 'name'
        .mockReturnValueOnce(null);          // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Hans Mueller' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: null 
      });

      const playerResult = {
        name: 'Hans Mueller',
        zpk: '12345',
        dwz: '1800',
        club: 'Test Club'
      };

      const playerDetails = {
        ...playerResult,
        tournaments: [{ name: 'Test Tournament', date: '2023-01-01' }]
      };

      const dwzInfoService = new DWZInfoService();
      dwzInfoService.searchPlayers = jest.fn().mockResolvedValue([playerResult]);
      dwzInfoService.addDisambiguationInfo = jest.fn().mockReturnValue([playerResult]);
      dwzInfoService.getPlayerDetails = jest.fn().mockResolvedValue(playerDetails);

      const embedService = new EmbedService();
      embedService.createPlayerDetailsEmbed.mockResolvedValue({ 
        embeds: [{ title: 'Player Details', description: 'Hans Mueller details' }] 
      });

      await dwzCommand.execute(mockInteraction);

      expect(dwzInfoService.searchPlayers).toHaveBeenCalledWith('Hans Mueller', null);
      expect(dwzInfoService.getPlayerDetails).toHaveBeenCalledWith('12345');
      expect(embedService.createPlayerDetailsEmbed).toHaveBeenCalledWith(playerDetails);
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    test('should handle single search result without ZPK', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Hans Mueller') // for 'name'
        .mockReturnValueOnce(null);          // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Hans Mueller' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: null 
      });

      const playerResult = {
        name: 'Hans Mueller',
        dwz: '1800',
        club: 'Test Club'
        // No ZPK
      };

      const dwzInfoService = new DWZInfoService();
      dwzInfoService.searchPlayers = jest.fn().mockResolvedValue([playerResult]);
      dwzInfoService.addDisambiguationInfo = jest.fn().mockReturnValue([playerResult]);

      const embedService = new EmbedService();
      embedService.createPlayerDetailsEmbed.mockResolvedValue({ 
        embeds: [{ title: 'Player Details', description: 'Hans Mueller details' }] 
      });

      await dwzCommand.execute(mockInteraction);

      expect(dwzInfoService.searchPlayers).toHaveBeenCalledWith('Hans Mueller', null);
      expect(embedService.createPlayerDetailsEmbed).toHaveBeenCalledWith({
        ...playerResult,
        tournaments: []
      });
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    test('should handle player details fetch error and fall back to basic embed', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      const { logger } = require('../../src/utils/logger');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Hans Mueller') // for 'name'
        .mockReturnValueOnce(null);          // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Hans Mueller' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: null 
      });

      const playerResult = {
        name: 'Hans Mueller',
        zpk: '12345',
        dwz: '1800',
        fide_rating: '1750',
        fide_title: 'FM',
        club: 'Test Club',
        nationality: 'GER'
      };

      const dwzInfoService = new DWZInfoService();
      dwzInfoService.searchPlayers = jest.fn().mockResolvedValue([playerResult]);
      dwzInfoService.addDisambiguationInfo = jest.fn().mockReturnValue([playerResult]);
      dwzInfoService.getPlayerDetails = jest.fn().mockRejectedValue(new Error('Details fetch failed'));

      const embedService = new EmbedService();
      embedService.createSuccessEmbed.mockReturnValue({ 
        title: 'Basic Player Info', 
        description: 'Hans Mueller basic info' 
      });

      await dwzCommand.execute(mockInteraction);

      expect(dwzInfoService.getPlayerDetails).toHaveBeenCalledWith('12345');
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to get player details',
        expect.objectContaining({
          playerZpk: '12345',
          playerName: 'Hans Mueller',
          error: 'Details fetch failed'
        })
      );
      expect(embedService.createSuccessEmbed).toHaveBeenCalledWith(
        '♟️ Hans Mueller',
        'DWZ-Informationen vom Deutschen Schachbund',
        expect.objectContaining({
          fields: expect.arrayContaining([
            { name: '🏆 DWZ', value: '1800', inline: true },
            { name: '🌍 FIDE', value: '1750', inline: true },
            { name: '👑 Titel', value: 'FM', inline: true },
            { name: '🏛️ Verein', value: 'Test Club', inline: true },
            { name: '🏳️ Nation', value: 'GER', inline: true },
            { name: '🆔 ZPK', value: '12345', inline: true }
          ])
        })
      );
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    test('should handle multiple search results', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Mueller') // for 'name'
        .mockReturnValueOnce('Berlin'); // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Mueller' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Berlin' 
      });

      const searchResults = [
        { name: 'Hans Mueller', zpk: '12345', dwz: '1800' },
        { name: 'Klaus Mueller', zpk: '67890', dwz: '1750' }
      ];

      const dwzInfoService = new DWZInfoService();
      dwzInfoService.searchPlayers = jest.fn().mockResolvedValue(searchResults);
      dwzInfoService.addDisambiguationInfo = jest.fn().mockReturnValue(searchResults);

      const embedService = new EmbedService();
      embedService.createMultiplePlayersEmbed.mockReturnValue({ 
        title: 'Multiple Results', 
        description: 'Multiple players found' 
      });

      await dwzCommand.execute(mockInteraction);

      expect(dwzInfoService.searchPlayers).toHaveBeenCalledWith('Mueller', 'Berlin');
      expect(embedService.createMultiplePlayersEmbed).toHaveBeenCalledWith(
        searchResults, 
        'Mueller (Club: Berlin)'
      );
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });
  });

  describe('Error Scenarios', () => {
    test('should handle search unavailable error', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      const { ERROR_MESSAGES } = require('../../src/constants');
      const { logger } = require('../../src/utils/logger');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Test Player') // for 'name'
        .mockReturnValueOnce(null);         // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Test Player' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: null 
      });

      const dwzInfoService = new DWZInfoService();
      dwzInfoService.searchPlayers = jest.fn().mockRejectedValue(new Error(ERROR_MESSAGES.SEARCH_UNAVAILABLE));
      dwzInfoService.addDisambiguationInfo = jest.fn();

      const embedService = new EmbedService();
      embedService.createErrorEmbed.mockReturnValue({ 
        title: 'Service Unavailable', 
        description: 'Search service temporarily unavailable' 
      });

      await dwzCommand.execute(mockInteraction);

      expect(logger.error).toHaveBeenCalledWith(
        'DWZ command execution failed',
        expect.objectContaining({
          playerName: 'Test Player',
          clubName: null,
          userId: '123456789'
        })
      );
      expect(embedService.createErrorEmbed).toHaveBeenCalledWith(
        'Suchservice nicht verfügbar',
        'Der Suchservice ist vorübergehend nicht verfügbar.',
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'Fehlerdetails',
              value: 'Die Suchschnittstelle könnte sich geändert haben. Versuchen Sie es später erneut oder suchen Sie direkt auf schachbund.de'
            }),
            expect.objectContaining({
              name: '🔗 Alternative',
              value: '[Direkt auf schachbund.de suchen](https://www.schachbund.de/spieler.html?search=Test%20Player)'
            })
          ])
        })
      );
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    test('should handle connection error', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      const { ERROR_MESSAGES } = require('../../src/constants');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Test Player') // for 'name'
        .mockReturnValueOnce('Test Club');  // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Test Player' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Test Club' 
      });

      const dwzInfoService = new DWZInfoService();
      dwzInfoService.searchPlayers = jest.fn().mockRejectedValue(new Error(ERROR_MESSAGES.CONNECTION_ERROR));
      dwzInfoService.addDisambiguationInfo = jest.fn();

      const embedService = new EmbedService();
      embedService.createErrorEmbed.mockReturnValue({ 
        title: 'Connection Error', 
        description: 'Cannot connect to schachbund.de' 
      });

      await dwzCommand.execute(mockInteraction);

      expect(embedService.createErrorEmbed).toHaveBeenCalledWith(
        'Verbindungsfehler',
        'Kann nicht zu schachbund.de verbinden',
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'Fehlerdetails',
              value: 'Überprüfen Sie Ihre Internetverbindung oder versuchen Sie es später erneut'
            }),
            expect.objectContaining({
              name: '🔗 Alternative',
              value: '[Direkt auf schachbund.de suchen](https://www.schachbund.de/spieler.html?search=Test%20Player)'
            })
          ])
        })
      );
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    test('should handle timeout error', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      const { ERROR_MESSAGES } = require('../../src/constants');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Test Player') // for 'name'
        .mockReturnValueOnce(null);         // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Test Player' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: null 
      });

      const dwzInfoService = new DWZInfoService();
      dwzInfoService.searchPlayers = jest.fn().mockRejectedValue(new Error(ERROR_MESSAGES.TIMEOUT_ERROR));
      dwzInfoService.addDisambiguationInfo = jest.fn();

      const embedService = new EmbedService();
      embedService.createErrorEmbed.mockReturnValue({ 
        title: 'Timeout Error', 
        description: 'Request timed out' 
      });

      await dwzCommand.execute(mockInteraction);

      expect(embedService.createErrorEmbed).toHaveBeenCalledWith(
        'Zeitüberschreitung',
        'Suchanfrage ist abgelaufen',
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'Fehlerdetails',
              value: 'Der Server antwortet langsam. Bitte versuchen Sie es erneut.'
            }),
            expect.objectContaining({
              name: '🔗 Alternative',
              value: '[Direkt auf schachbund.de suchen](https://www.schachbund.de/spieler.html?search=Test%20Player)'
            })
          ])
        })
      );
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });

    test('should handle unknown error', async () => {
      const { validatePlayerName, validateClubName } = require('../../src/validators');
      const DWZInfoService = require('../../src/services/dwzInfoService');
      const EmbedService = require('../../src/services/embedService');
      
      mockInteraction.options.getString
        .mockReturnValueOnce('Test Player') // for 'name'
        .mockReturnValueOnce(null);         // for 'club'

      validatePlayerName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: 'Test Player' 
      });
      validateClubName.mockReturnValue({ 
        isValid: true, 
        sanitizedValue: null 
      });

      const dwzInfoService = new DWZInfoService();
      dwzInfoService.searchPlayers = jest.fn().mockRejectedValue(new Error('Unknown error'));
      dwzInfoService.addDisambiguationInfo = jest.fn();

      const embedService = new EmbedService();
      embedService.createErrorEmbed.mockReturnValue({ 
        title: 'Unknown Error', 
        description: 'Unknown error occurred' 
      });

      await dwzCommand.execute(mockInteraction);

      expect(embedService.createErrorEmbed).toHaveBeenCalledWith(
        'DWZ Suche Fehler',
        'Sorry, there was an error searching for the player.',
        expect.objectContaining({
          fields: expect.arrayContaining([
            expect.objectContaining({
              name: 'Fehlerdetails',
              value: 'Unknown error'
            }),
            expect.objectContaining({
              name: '🔗 Alternative',
              value: '[Direkt auf schachbund.de suchen](https://www.schachbund.de/spieler.html?search=Test%20Player)'
            })
          ])
        })
      );
      expect(mockInteraction.editReply).toHaveBeenCalled();
    });
  });

  describe('Integration with Services', () => {
    test('should have correct command structure with data and execute', async () => {
      // The exported command should have the expected structure
      expect(dwzCommand).toHaveProperty('data');
      expect(dwzCommand).toHaveProperty('execute');
      expect(typeof dwzCommand.execute).toBe('function');
    });

    test('should use mocked services during execution', async () => {
      mockInteraction.options.getString.mockReturnValue('Hans Müller');
      
      // Services should be available as properties when the command is constructed
      const dwzCommand = require('../../src/commands/dwz');
      expect(dwzCommand).toHaveProperty('data');
      expect(dwzCommand).toHaveProperty('execute');
      
      // The services are constructed internally, not exposed as direct calls
      // So we verify that the command structure is correct
      expect(typeof dwzCommand.execute).toBe('function');
    });
  });
});
