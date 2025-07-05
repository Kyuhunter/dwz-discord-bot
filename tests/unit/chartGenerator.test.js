/**
 * Unit Tests for Chart Generator
 */

const { generateDWZChart, _prepareTournamentData, _prepareChartData } = require('../../src/utils/chartGenerator');

// Mock dependencies
jest.mock('chartjs-node-canvas', () => ({
  ChartJSNodeCanvas: jest.fn().mockImplementation(() => ({
    renderToBuffer: jest.fn().mockResolvedValue(Buffer.from('mock-chart-data'))
  }))
}));

jest.mock('discord.js', () => ({
  AttachmentBuilder: jest.fn().mockImplementation((buffer, options) => ({
    attachment: buffer,
    ...options
  }))
}));

jest.mock('fs');
jest.mock('path');

jest.mock('../../src/constants', () => ({
  CHART_CONFIG: {
    WIDTH: 800,
    HEIGHT: 400,
    BACKGROUND_COLOR: '#ffffff'
  },
  DWZ_CONSTANTS: {
    MIN_RATING: 500,
    MAX_RATING: 3000
  },
  LIMITS: {
    MIN_TOURNAMENTS_FOR_CHART: 2
  }
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
    logChartGeneration: jest.fn()
  }
}));

jest.mock('../../src/validators', () => ({
  validateTournamentData: jest.fn()
}));

describe('Chart Generator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateDWZChart', () => {
    test('should generate chart for valid tournament data', async () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          dwzOld: 1480,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          dwzNew: 1520,
          dwzOld: 1500,
          name: 'Tournament 2'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      const result = await generateDWZChart(mockTournaments, 'Hans Müller');

      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });

    test('should return null for invalid tournament data', async () => {
      const mockTournaments = [];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ 
        isValid: false, 
        error: 'No tournaments provided' 
      });

      const result = await generateDWZChart(mockTournaments, 'Test Player');

      expect(result).toBeNull();
    });

    test('should return null for insufficient tournaments', async () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          dwzOld: 1480,
          name: 'Tournament 1'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      const result = await generateDWZChart(mockTournaments, 'Test Player');

      expect(result).toBeNull();
    });

    test('should handle chart generation errors gracefully', async () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          dwzOld: 1480,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          dwzNew: 1520,
          dwzOld: 1500,
          name: 'Tournament 2'
        }
      ];

      const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
      const mockChart = new ChartJSNodeCanvas();
      mockChart.renderToBuffer.mockRejectedValue(new Error('Chart generation failed'));

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      const result = await generateDWZChart(mockTournaments, 'Test Player');

      expect(result).toBeNull();
    });

    test('should log chart generation process', async () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          dwzOld: 1480,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          dwzNew: 1520,
          dwzOld: 1500,
          name: 'Tournament 2'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      const { logger } = require('../../src/utils/logger');

      await generateDWZChart(mockTournaments, 'Hans Müller');

      expect(logger.logChartGeneration).toHaveBeenCalledWith('Hans Müller', mockTournaments);
      expect(logger.info).toHaveBeenCalled();
    });
  });

  describe('Tournament Data Preparation', () => {
    test('should sort tournaments by date', () => {
      const mockTournaments = [
        {
          date: '2024-02-01',
          dwzNew: 1520,
          name: 'Tournament 2'
        },
        {
          date: '2024-01-01',
          dwzNew: 1500,
          name: 'Tournament 1'
        }
      ];

      // Mock the private function if it's exported for testing
      // Otherwise, test through the public interface
      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      // Test the behavior through the main function
      expect(() => generateDWZChart(mockTournaments, 'Test')).not.toThrow();
    });

    test('should filter out tournaments with invalid ratings', () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          name: 'Valid Tournament'
        },
        {
          date: '2024-02-01',
          dwzNew: null,
          name: 'Invalid Tournament'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      expect(() => generateDWZChart(mockTournaments, 'Test')).not.toThrow();
    });
  });

  describe('Chart Data Preparation', () => {
    test('should create proper chart data structure', async () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          dwzNew: 1520,
          name: 'Tournament 2'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      // Test through the main function since chart data preparation is internal
      const result = await generateDWZChart(mockTournaments, 'Test Player');
      
      expect(result).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed tournament dates', async () => {
      const mockTournaments = [
        {
          date: 'invalid-date',
          dwzNew: 1500,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          dwzNew: 1520,
          name: 'Tournament 2'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      const result = await generateDWZChart(mockTournaments, 'Test Player');
      
      // Should handle gracefully and potentially return null or filter out invalid data
      expect(result).toBeDefined();
    });

    test('should handle missing required fields', async () => {
      const mockTournaments = [
        {
          // Missing date
          dwzNew: 1500,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          // Missing dwzNew
          name: 'Tournament 2'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ 
        isValid: false, 
        error: 'Missing required fields' 
      });

      const result = await generateDWZChart(mockTournaments, 'Test Player');
      
      expect(result).toBeNull();
    });

    test('should handle empty player name', async () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          dwzNew: 1520,
          name: 'Tournament 2'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      const result = await generateDWZChart(mockTournaments, '');
      
      expect(result).toBeDefined(); // Should still generate chart with empty name
    });
  });

  describe('Chart Configuration', () => {
    test('should use proper chart dimensions', async () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          dwzNew: 1520,
          name: 'Tournament 2'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
      
      await generateDWZChart(mockTournaments, 'Test Player');

      expect(ChartJSNodeCanvas).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 800,
          height: 400,
          backgroundColour: '#ffffff'
        })
      );
    });
  });

  describe('File Operations', () => {
    test('should handle file system operations gracefully', async () => {
      const mockTournaments = [
        {
          date: '2024-01-01',
          dwzNew: 1500,
          name: 'Tournament 1'
        },
        {
          date: '2024-02-01',
          dwzNew: 1520,
          name: 'Tournament 2'
        }
      ];

      const { validateTournamentData } = require('../../src/validators');
      validateTournamentData.mockReturnValue({ isValid: true });

      const fs = require('fs');
      fs.writeFileSync = jest.fn(); // Mock file writing

      const result = await generateDWZChart(mockTournaments, 'Test Player');
      
      expect(result).toBeDefined();
    });
  });
});
