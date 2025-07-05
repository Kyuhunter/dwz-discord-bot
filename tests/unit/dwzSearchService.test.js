/**
 * Unit Tests for DWZ Search Service
 */

const axios = require('axios');
const DWZSearchService = require('../../src/services/dwzSearchService');

// Mock axios completely
jest.mock('axios');
const mockedAxios = axios;

describe('DWZ Search Service', () => {
  let dwzSearchService;

  beforeEach(() => {
    dwzSearchService = new DWZSearchService();
    jest.clearAllMocks();
  });

  describe('searchPlayer', () => {
    test('should search for a player successfully', async () => {
      const mockHtmlResponse = '<table><tr><td><a href="/player/123">Hans Müller</a></td><td>1500</td><td>SC Berlin</td></tr></table>';

      mockedAxios.get.mockResolvedValueOnce({
        data: mockHtmlResponse,
        status: 200
      });

      const result = await dwzSearchService.searchPlayer('Hans Müller');

      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(Array.isArray(result.players)).toBe(true);
    });

    test('should handle network errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await dwzSearchService.searchPlayer('Test Player');

      expect(result).toBeDefined();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    test('should validate input parameters', async () => {
      const result1 = await dwzSearchService.searchPlayer('');
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Invalid');

      const result2 = await dwzSearchService.searchPlayer(null);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Invalid');
    });
  });

  describe('getPlayerDetails', () => {
    test('should handle invalid player ID', async () => {
      const result1 = await dwzSearchService.getPlayerDetails('');
      expect(result1.success).toBe(false);

      const result2 = await dwzSearchService.getPlayerDetails(null);
      expect(result2.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    test('should handle axios network errors gracefully', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('ENOTFOUND'));

      const result = await dwzSearchService.searchPlayer('Test');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.players).toEqual([]);
    });
  });
});
