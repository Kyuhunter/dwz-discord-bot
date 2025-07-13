/**
 * Unit tests for DWZ Info Service (Python package integration)
 */

const DWZInfoService = require('../../src/services/dwzInfoService');

describe('DWZInfoService', () => {
  let dwzInfoService;

  beforeEach(() => {
    dwzInfoService = new DWZInfoService();
  });

  test('should instantiate service', () => {
    expect(dwzInfoService).toBeDefined();
    expect(dwzInfoService.searchPlayers).toBeInstanceOf(Function);
    expect(dwzInfoService.getPlayerDetails).toBeInstanceOf(Function);
  });

  test('should validate input parameters for searchPlayers', async () => {
    await expect(dwzInfoService.searchPlayers('')).rejects.toThrow('Invalid player name');
    await expect(dwzInfoService.searchPlayers(null)).rejects.toThrow('Invalid player name');
  });

  test('should validate input parameters for getPlayerDetails', async () => {
    await expect(dwzInfoService.getPlayerDetails('')).rejects.toThrow('Invalid player ID');
    await expect(dwzInfoService.getPlayerDetails(null)).rejects.toThrow('Invalid player ID');
  });
});
