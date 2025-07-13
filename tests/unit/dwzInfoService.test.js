/**
 * Unit tests for DWZ Info Service (Python package integration)
 */

const DWZInfoService = require('../../src/services/dwzInfoService');

// Mock the child_process spawn function
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

const { spawn } = require('child_process');

describe('DWZInfoService', () => {
  let dwzInfoService;

  beforeEach(() => {
    dwzInfoService = new DWZInfoService();
    jest.clearAllMocks();
  });

  describe('searchPlayers', () => {
    test('should search for a player successfully', async () => {
      // Mock successful Python script response
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn()
      };

      spawn.mockReturnValue(mockProcess);

      // Simulate successful response
      const mockResponse = {
        players: [{
          name: 'Hans Mueller',
          dwz: 1234,
          club: 'Test Club',
          zpk: '123456'
        }]
      };

      // Trigger the stdout data event
      setTimeout(() => {
        const stdoutCallback = mockProcess.stdout.on.mock.calls.find(call => call[0] === 'data')[1];
        stdoutCallback(JSON.stringify(mockResponse));
        
        // Trigger process close with success code
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
        closeCallback(0);
      }, 0);

      const result = await dwzInfoService.searchPlayers('Hans Mueller');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Hans Mueller');
    });

    test('should handle Python script errors', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn()
      };

      spawn.mockReturnValue(mockProcess);

      // Simulate error response
      const mockResponse = { error: 'No players found' };

      setTimeout(() => {
        const stdoutCallback = mockProcess.stdout.on.mock.calls.find(call => call[0] === 'data')[1];
        stdoutCallback(JSON.stringify(mockResponse));
        
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
        closeCallback(1);
      }, 0);

      await expect(dwzInfoService.searchPlayers('Test Player')).rejects.toThrow('No players found');
    });

    test('should validate input parameters', async () => {
      await expect(dwzInfoService.searchPlayers('')).rejects.toThrow('Invalid player name');
      await expect(dwzInfoService.searchPlayers(null)).rejects.toThrow('Invalid player name');
    });
  });

  describe('getPlayerDetails', () => {
    test('should handle invalid player ID', async () => {
      await expect(dwzInfoService.getPlayerDetails('')).rejects.toThrow('Invalid player ID');
      await expect(dwzInfoService.getPlayerDetails(null)).rejects.toThrow('Invalid player ID');
    });

    test('should get player details successfully', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn()
      };

      spawn.mockReturnValue(mockProcess);

      const mockResponse = {
        tournaments: [{
          tournament_name: 'Test Tournament',
          dwz_old: 1200,
          dwz_new: 1234,
          games: 5,
          points: 3.5
        }]
      };

      setTimeout(() => {
        const stdoutCallback = mockProcess.stdout.on.mock.calls.find(call => call[0] === 'data')[1];
        stdoutCallback(JSON.stringify(mockResponse));
        
        const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
        closeCallback(0);
      }, 0);

      const result = await dwzInfoService.getPlayerDetails('123456');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0].turniername).toBe('Test Tournament');
    });
  });
});
