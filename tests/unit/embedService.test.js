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
    embedService = new EmbedService();
    
    // Get the mock constructor
    const { EmbedBuilder } = require('discord.js');
    mockEmbedBuilder = new EmbedBuilder();
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
      
      // Footer should not be added when footer: false
      expect(mockEmbedBuilder.setFooter).not.toHaveBeenCalled();
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
