/**
 * Unit Tests for Embed Service
 */

const EmbedService = require('../../src/services/embedService');

// Mock discord.js
jest.mock('discord.js', () => ({
  EmbedBuilder: jest.fn().mockImplementation(() => ({
    setColor: jest.fn().mockReturnThis(),
    setTitle: jest.fn().mockReturnThis(),
    setDescription: jest.fn().mockReturnThis(),
    addFields: jest.fn().mockReturnThis(),
    setFooter: jest.fn().mockReturnThis(),
    setTimestamp: jest.fn().mockReturnThis(),
    setURL: jest.fn().mockReturnThis(),
    setThumbnail: jest.fn().mockReturnThis()
  }))
}));

// Mock dependencies
jest.mock('../../src/constants', () => ({
  EMBED_COLORS: {
    ERROR: '#FF0000',
    SUCCESS: '#00FF00',
    INFO: '#0099FF',
    WARNING: '#FFAA00'
  },
  EXTERNAL_URLS: {
    SCHACHBUND_BASE: 'https://www.schachbund.de'
  },
  LIMITS: {
    EMBED_DESCRIPTION_MAX: 4096
  },
  ERROR_MESSAGES: {
    GENERIC: 'An error occurred'
  }
}));

jest.mock('../../src/utils/config', () => ({
  getBotConfig: jest.fn(() => ({
    name: 'DWZ Bot',
    version: '1.0.0'
  }))
}));

describe('Embed Service', () => {
  let embedService;
  let mockEmbedBuilder;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set up the mock EmbedBuilder
    mockEmbedBuilder = {
      setColor: jest.fn().mockReturnThis(),
      setTitle: jest.fn().mockReturnThis(),
      setDescription: jest.fn().mockReturnThis(),
      addFields: jest.fn().mockReturnThis(),
      setFooter: jest.fn().mockReturnThis(),
      setTimestamp: jest.fn().mockReturnThis(),
      setURL: jest.fn().mockReturnThis(),
      setThumbnail: jest.fn().mockReturnThis()
    };
    
    // Get the mock constructor
    const { EmbedBuilder } = require('discord.js');
    EmbedBuilder.mockImplementation(() => mockEmbedBuilder);
    
    embedService = new EmbedService();
  });
  beforeAll(() => {
    jest.spyOn(embedService, '_generateChartIfPossible').mockImplementation(() => Promise.resolve({ name: 'chart.png', attachment: Buffer.from('dummy') }));
  });

  describe('createErrorEmbed', () => {
    test('should create error embed with title and description', () => {
      const title = 'Test Error';
      const description = 'Error description';
      
      const result = embedService.createErrorEmbed(title, description);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#FF0000');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith('❌ Test Error');
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith('Error description');
      expect(result).toBe(mockEmbedBuilder);
    });

    test('should handle options with fields', () => {
      const options = {
        fields: [
          { name: 'Field 1', value: 'Value 1', inline: true },
          { name: 'Field 2', value: 'Value 2', inline: false }
        ]
      };
      
      embedService.createErrorEmbed('Title', 'Description', options);
      
      expect(mockEmbedBuilder.addFields).toHaveBeenCalledWith(options.fields);
    });

    test('should handle options without footer', () => {
      const options = { footer: false };
      
      embedService.createErrorEmbed('Title', 'Description', options);
      
      expect(mockEmbedBuilder.setFooter).not.toHaveBeenCalled();
    });

    test('should add footer by default', () => {
      embedService.createErrorEmbed('Title', 'Description');
      
      expect(mockEmbedBuilder.setFooter).toHaveBeenCalled();
      expect(mockEmbedBuilder.setTimestamp).toHaveBeenCalled();
    });

    test('should handle custom footer text', () => {
      const options = { footerText: 'Custom footer' };
      
      embedService.createErrorEmbed('Title', 'Description', options);
      
      expect(mockEmbedBuilder.setFooter).toHaveBeenCalledWith({
        text: 'Custom footer',
        iconURL: undefined
      });
    });
  });

  describe('createSuccessEmbed', () => {
    test('should create success embed with title and description', () => {
      const title = 'Test Success';
      const description = 'Success description';
      
      const result = embedService.createSuccessEmbed(title, description);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#00FF00');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith('✅ Test Success');
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith('Success description');
      expect(result).toBe(mockEmbedBuilder);
    });

    test('should handle options with fields', () => {
      const options = {
        fields: [
          { name: 'Field 1', value: 'Value 1', inline: true }
        ]
      };
      
      embedService.createSuccessEmbed('Title', 'Description', options);
      
      expect(mockEmbedBuilder.addFields).toHaveBeenCalledWith(options.fields);
    });

    test('should handle options without footer', () => {
      const options = { footer: false };
      
      embedService.createSuccessEmbed('Title', 'Description', options);
      
      expect(mockEmbedBuilder.setFooter).not.toHaveBeenCalled();
    });
  });

  describe('createInfoEmbed', () => {
    test('should create info embed with title and description', () => {
      const title = 'Test Info';
      const description = 'Info description';
      
      const result = embedService.createInfoEmbed(title, description);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#0099FF');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith('Test Info');
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith('Info description');
      expect(result).toBe(mockEmbedBuilder);
    });

    test('should handle options with fields', () => {
      const options = {
        fields: [
          { name: 'Field 1', value: 'Value 1', inline: true }
        ]
      };
      
      embedService.createInfoEmbed('Title', 'Description', options);
      
      expect(mockEmbedBuilder.addFields).toHaveBeenCalledWith(options.fields);
    });

    test('should handle options without footer', () => {
      const options = { footer: false };
      
      embedService.createInfoEmbed('Title', 'Description', options);
      
      expect(mockEmbedBuilder.setFooter).not.toHaveBeenCalled();
    });
  });

  describe('createNoPlayersFoundEmbed', () => {
    test('should create no players found embed without club filter', () => {
      const searchQuery = 'Unknown Player';
      
      const result = embedService.createNoPlayersFoundEmbed(searchQuery, false);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#FF0000');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith('🔍 Keine Spieler gefunden');
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith('Keine Spieler gefunden für: **Unknown Player**');
      expect(mockEmbedBuilder.addFields).toHaveBeenCalledTimes(2);
      expect(result).toBe(mockEmbedBuilder);
    });

    test('should create no players found embed with club filter', () => {
      const searchQuery = 'Unknown Player (Club: Test Club)';
      
      const result = embedService.createNoPlayersFoundEmbed(searchQuery, true);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#FF0000');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith('🔍 Keine Spieler gefunden');
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith('Keine Spieler gefunden für: **Unknown Player (Club: Test Club)**');
      expect(mockEmbedBuilder.addFields).toHaveBeenCalledTimes(2);
      
      // Verify search tips include club-specific advice
      const addFieldsCalls = mockEmbedBuilder.addFields.mock.calls;
      const searchTipsCall = addFieldsCalls.find(call => 
        call[0].name === '💡 Suchtipps'
      );
      expect(searchTipsCall[0].value).toContain('Überprüfen Sie den Vereinsnamen oder lassen Sie das Club-Feld leer');
    });

    test('should include general search tips without club filter', () => {
      const searchQuery = 'Test Player';
      
      embedService.createNoPlayersFoundEmbed(searchQuery, false);
      
      const addFieldsCalls = mockEmbedBuilder.addFields.mock.calls;
      const searchTipsCall = addFieldsCalls.find(call => 
        call[0].name === '💡 Suchtipps'
      );
      expect(searchTipsCall[0].value).toContain('Verwenden Sie das Club-Feld für präzisere Suche');
    });
  });

  describe('createMultiplePlayersEmbed', () => {
    test('should create multiple players embed', () => {
      const players = [
        { name: 'Player 1', zpk: '12345', dwz: '1800', club: 'Club A' },
        { name: 'Player 2', zpk: '67890', dwz: '1750', club: 'Club B' }
      ];
      const searchQuery = 'Player';
      
      const result = embedService.createMultiplePlayersEmbed(players, searchQuery);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#0099FF');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith('🔍 Mehrere Spieler gefunden');
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith('Gefunden: **2** Spieler für "Player"');
      expect(result).toBe(mockEmbedBuilder);
    });

    test('should handle players with duplicate names', () => {
      const players = [
        { name: 'Player 1', zpk: '12345', dwz: '1800', club: 'Club A', hasNameDuplicate: true },
        { name: 'Player 1', zpk: '67890', dwz: '1750', club: 'Club B', hasNameDuplicate: true }
      ];
      const searchQuery = 'Player 1';
      
      embedService.createMultiplePlayersEmbed(players, searchQuery);
      
      // Should call _addDuplicateNamesHint method
      expect(mockEmbedBuilder.addFields).toHaveBeenCalled();
    });

    test('should handle more results than limit', () => {
      // Mock LIMITS to test truncation
      const { LIMITS } = require('../../src/constants');
      LIMITS.MAX_SEARCH_RESULTS = 2;
      
      const players = [
        { name: 'Player 1', zpk: '12345', dwz: '1800', club: 'Club A' },
        { name: 'Player 2', zpk: '67890', dwz: '1750', club: 'Club B' },
        { name: 'Player 3', zpk: '11111', dwz: '1700', club: 'Club C' }
      ];
      const searchQuery = 'Player';
      
      embedService.createMultiplePlayersEmbed(players, searchQuery);
      
      // Should add "more results" field
      const addFieldsCalls = mockEmbedBuilder.addFields.mock.calls;
      const moreResultsCall = addFieldsCalls.find(call => 
        call[0].name === '📋 Weitere Ergebnisse'
      );
      expect(moreResultsCall).toBeDefined();
      expect(moreResultsCall[0].value).toContain('Es gibt 1 weitere Spieler');
    });
  });

  describe('createPlayerDetailsEmbed', () => {
    beforeEach(() => {
      // Mock chart generation to return null (no chart)
      jest.spyOn(embedService, '_generateChartIfPossible').mockResolvedValue(null);
    });

    test('should create player details embed without tournaments', async () => {
      const player = {
        name: 'Hans Mueller',
        zpk: '12345',
        dwz: '1800',
        club: 'Test Club'
      };
      
      const result = await embedService.createPlayerDetailsEmbed(player);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#00FF00');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith('♟️ Hans Mueller');
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith('DWZ-Informationen vom Deutschen Schachbund');
      expect(result).toEqual({
        embeds: [mockEmbedBuilder],
        files: []
      });
    });

    test('should create player details embed with tournaments', async () => {
      const player = {
        name: 'Hans Mueller',
        zpk: '12345',
        dwz: '1800',
        club: 'Test Club',
        tournaments: [
          { name: 'Tournament 1', date: '2023-01-01', rating: '1800' },
          { name: 'Tournament 2', date: '2023-02-01', rating: '1825' }
        ]
      };
      
      jest.spyOn(embedService, '_addTournamentStatistics').mockImplementation(() => {});
      
      const result = await embedService.createPlayerDetailsEmbed(player);
      
      expect(embedService._addTournamentStatistics).toHaveBeenCalledWith(mockEmbedBuilder, player.tournaments);
      expect(result).toEqual({
        embeds: [mockEmbedBuilder],
        files: []
      });
    });

    test('should create player details embed with chart attachment', async () => {
      const player = {
        name: 'Hans Mueller',
        zpk: '12345',
        dwz: '1800',
        tournaments: [
          { name: 'Tournament 1', date: '2023-01-01', rating: '1800' }
        ]
      };
      
      const mockChartAttachment = { name: 'chart.png', attachment: 'mock-buffer' };
      embedService._generateChartIfPossible.mockResolvedValue(mockChartAttachment);
      
      const result = await embedService.createPlayerDetailsEmbed(player);
      
      expect(result).toEqual({
        embeds: [mockEmbedBuilder],
        files: [mockChartAttachment]
      });
    });
  });


  describe('createSuccessEmbed', () => {
    test('should create success embed with correct color and title', () => {
      const title = 'Success Title';
      const description = 'Success description';
      
      embedService.createSuccessEmbed(title, description);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#00FF00');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith('✅ Success Title');
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith('Success description');
    });
  });

  describe('createInfoEmbed', () => {
    test('should create info embed with correct color', () => {
      const title = 'Info Title';
      const description = 'Info description';
      
      embedService.createInfoEmbed(title, description);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalledWith('#0099FF');
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith(title);
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalledWith(description);
    });
  });

  describe('createNoPlayersFoundEmbed', () => {
    test('should create no players found embed', () => {
      const searchQuery = 'Hans Müller';
      
      embedService.createNoPlayersFoundEmbed(searchQuery);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalled();
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalled();
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalled();
    });

    test('should handle club filter parameter', () => {
      const searchQuery = 'Test Player';
      const hasClubFilter = true;
      
      embedService.createNoPlayersFoundEmbed(searchQuery, hasClubFilter);
      
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalled();
    });
  });

  describe('createMultiplePlayersEmbed', () => {
    test('should create multiple players embed', () => {
      const players = [
        { name: 'Hans Müller', dwz: 1500, club: 'SC Berlin' },
        { name: 'Anna Schmidt', dwz: 1600, club: 'SC München' }
      ];
      const searchQuery = 'test';
      
      embedService.createMultiplePlayersEmbed(players, searchQuery);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalled();
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalled();
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalled();
    });

    test('should handle empty players array', () => {
      const players = [];
      const searchQuery = 'test';
      
      embedService.createMultiplePlayersEmbed(players, searchQuery);
      
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalled();
    });
  });

  describe('createPlayerDetailsEmbed', () => {
    test('should create player details embed for complete player data', async () => {
      const player = {
        name: 'Hans Müller',
        dwz: 1500,
        club: 'SC Berlin',
        memberNumber: '12345',
        tournaments: [
          {
            name: 'Test Tournament',
            date: '2024-01-15',
            dwzOld: 1480,
            dwzNew: 1500
          }
        ]
      };
      
      await embedService.createPlayerDetailsEmbed(player);
      
      expect(mockEmbedBuilder.setColor).toHaveBeenCalled();
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalled();
      expect(mockEmbedBuilder.addFields).toHaveBeenCalled();
    });

    test('should handle minimal player data', async () => {
      const player = {
        name: 'Test Player',
        dwz: null,
        club: null
      };
      
      await embedService.createPlayerDetailsEmbed(player);
      
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalled();
    });
  });

  describe('Helper methods', () => {
    test('should format DWZ rating correctly', () => {
      // Test private method through public interface
      const player = { dwz: 1500 };
      embedService.createPlayerDetailsEmbed(player);
      
      expect(mockEmbedBuilder.addFields).toHaveBeenCalled();
    });

    test('should handle null or undefined values gracefully', () => {
      const player = {
        name: 'Test Player',
        dwz: null,
        club: undefined
      };
      
      expect(() => {
        embedService.createPlayerDetailsEmbed(player);
      }).not.toThrow();
    });
  });

  describe('Edge cases', () => {
    test('should handle very long descriptions', () => {
      const longDescription = 'A'.repeat(5000); // Exceeds Discord limit
      
      embedService.createErrorEmbed('Title', longDescription);
      
      expect(mockEmbedBuilder.setDescription).toHaveBeenCalled();
    });

    test('should handle special characters in titles', () => {
      const titleWithSpecialChars = 'Test & Title < > "quotes"';
      
      embedService.createInfoEmbed(titleWithSpecialChars, 'Description');
      
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalledWith(titleWithSpecialChars);
    });

    test('should handle empty options object', () => {
      embedService.createErrorEmbed('Title', 'Description', {});
      
      expect(mockEmbedBuilder.setTitle).toHaveBeenCalled();
    });
  });
});
