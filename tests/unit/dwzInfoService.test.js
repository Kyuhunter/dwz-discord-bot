/**
 * Unit tests for DWZ Info Service (Python package integration)
 */

const DWZInfoService = require('../../src/services/dwzInfoService');

// Mock child_process spawn function
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

  /**
   * Helper function to create mock process for testing
   */
  const createMockProcess = () => ({
    stdout: { on: jest.fn() },
    stderr: { on: jest.fn() },
    on: jest.fn()
  });

  /**
   * Helper function to simulate Python script response
   */
  const simulateProcessResponse = (mockProcess, response, exitCode = 0) => {
    // Simulate stdout data
    const stdoutCallback = mockProcess.stdout.on.mock.calls.find(call => call[0] === 'data')[1];
    stdoutCallback(JSON.stringify(response));
    
    // Simulate process close
    const closeCallback = mockProcess.on.mock.calls.find(call => call[0] === 'close')[1];
    closeCallback(exitCode);
  };

  describe('searchPlayers', () => {
    test('should validate input parameters', async () => {
      await expect(dwzInfoService.searchPlayers('')).rejects.toThrow('Invalid player name');
      await expect(dwzInfoService.searchPlayers(null)).rejects.toThrow('Invalid player name');
      await expect(dwzInfoService.searchPlayers(undefined)).rejects.toThrow('Invalid player name');
    });

    test('should search for a player successfully', async () => {
      const mockProcess = createMockProcess();
      spawn.mockReturnValue(mockProcess);

      const mockResponse = {
        players: [{
          name: 'Mueller,Hans',
          dwz: '1234',
          club: 'Test Club',
          zpk: '123456'
        }]
      };

      // Use setImmediate for more reliable async behavior
      setImmediate(() => simulateProcessResponse(mockProcess, mockResponse));

      const result = await dwzInfoService.searchPlayers('Hans Mueller');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Mueller,Hans',
        dwz: '1234',
        club: 'Test Club',
        zpk: '123456'
      });
    });

    test('should handle Python script errors', async () => {
      const mockProcess = createMockProcess();
      spawn.mockReturnValue(mockProcess);

      const mockResponse = { error: 'No players found' };

      setImmediate(() => simulateProcessResponse(mockProcess, mockResponse, 1));

      await expect(dwzInfoService.searchPlayers('Nonexistent Player'))
        .rejects.toThrow('No players found');
    });

    test('should handle multiple players found', async () => {
      const mockProcess = createMockProcess();
      spawn.mockReturnValue(mockProcess);

      const mockResponse = {
        players: [
          { name: 'Mueller,Hans', dwz: '1234', club: 'Club A', zpk: '123456' },
          { name: 'Mueller,Hans', dwz: '1456', club: 'Club B', zpk: '789012' }
        ]
      };

      setImmediate(() => simulateProcessResponse(mockProcess, mockResponse, 1));

      const result = await dwzInfoService.searchPlayers('Hans Mueller');
      
      // Multiple players should be returned with disambiguation info
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('hasNameDuplicate', true);
      expect(result[1]).toHaveProperty('hasNameDuplicate', true);
    });
  });

  describe('getPlayerDetails', () => {
    test('should validate input parameters', async () => {
      await expect(dwzInfoService.getPlayerDetails('')).rejects.toThrow('Invalid player ID');
      await expect(dwzInfoService.getPlayerDetails(null)).rejects.toThrow('Invalid player ID');
      await expect(dwzInfoService.getPlayerDetails(undefined)).rejects.toThrow('Invalid player ID');
    });

    test('should get player details successfully', async () => {
      const mockProcess = createMockProcess();
      spawn.mockReturnValue(mockProcess);

      const mockResponse = {
        player: {
          name: 'Mueller,Hans',
          dwz: '1234',
          club: 'Test Club',
          zpk: '123456',
          tournaments: [{
            tournament_name: 'Test Tournament 2024',
            dwz_old: '1200',
            dwz_new: '1234',
            games: '5',
            points: '3.5',
            leistung: '1300'
          }]
        }
      };

      setImmediate(() => simulateProcessResponse(mockProcess, mockResponse));

      const result = await dwzInfoService.getPlayerDetails('123456');

      expect(result).toBeDefined();
      expect(result).toHaveProperty('zpk', '123456');
      expect(result).toHaveProperty('name', 'Mueller,Hans');
      expect(result).toHaveProperty('dwz', '1234');
      expect(result).toHaveProperty('tournaments');
      expect(Array.isArray(result.tournaments)).toBe(true);
      expect(result.tournaments).toHaveLength(1);
      expect(result.tournaments[0]).toMatchObject({
        turniername: 'Test Tournament 2024',
        dwzalt: '1200',
        dwzneu: '1234',
        partien: '5',
        punkte: '3.5',
        leistung: '1300'
      });
    });

    test('should handle player not found', async () => {
      const mockProcess = createMockProcess();
      spawn.mockReturnValue(mockProcess);

      const mockResponse = { error: 'Player not found' };

      setImmediate(() => simulateProcessResponse(mockProcess, mockResponse, 1));

      await expect(dwzInfoService.getPlayerDetails('999999'))
        .rejects.toThrow('Player not found');
    });
  });

  describe('Python script integration', () => {
    test('should call Python script with correct arguments for search', async () => {
      const mockProcess = createMockProcess();
      spawn.mockReturnValue(mockProcess);

      const mockResponse = { players: [{ name: 'Test', dwz: '1000', club: 'Club', zpk: '123' }] };
      setImmediate(() => simulateProcessResponse(mockProcess, mockResponse));

      await dwzInfoService.searchPlayers('Test Player');

      expect(spawn).toHaveBeenCalledWith('python3', [
        expect.stringContaining('dwz_player_search.py'),
        '--format',
        'json',
        'Test Player'
      ], expect.objectContaining({
        timeout: expect.any(Number),
        killSignal: 'SIGTERM'
      }));
    });

    test('should call Python script with correct arguments for details', async () => {
      const mockProcess = createMockProcess();
      spawn.mockReturnValue(mockProcess);

      const mockResponse = {
        player: { name: 'Test', dwz: '1000', club: 'Club', zpk: '123456' },
        tournaments: []
      };
      setImmediate(() => simulateProcessResponse(mockProcess, mockResponse));

      await dwzInfoService.getPlayerDetails('123456');

      expect(spawn).toHaveBeenCalledWith('python3', [
        expect.stringContaining('dwz_player_search.py'),
        '--format',
        'json',
        '--player-id',
        '123456'
      ], expect.objectContaining({
        timeout: expect.any(Number),
        killSignal: 'SIGTERM'
      }));
    });
  });
});
