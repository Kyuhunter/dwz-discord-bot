/**
 * Jest Setup File
 * Global test configuration and utilities
 */

// Suppress console logs during tests unless in debug mode
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DISCORD_TOKEN = 'test_token_123456789';

// Global test utilities
global.mockInteraction = (options = {}) => ({
  reply: jest.fn().mockResolvedValue(),
  editReply: jest.fn().mockResolvedValue(),
  followUp: jest.fn().mockResolvedValue(),
  deferReply: jest.fn().mockResolvedValue(),
  user: {
    id: '123456789',
    username: 'testuser',
    tag: 'testuser#1234',
    ...options.user
  },
  guild: {
    id: '987654321',
    name: 'Test Guild',
    ...options.guild
  },
  channel: {
    id: '555666777',
    name: 'test-channel',
    ...options.channel
  },
  options: {
    getString: jest.fn(),
    getUser: jest.fn(),
    getChannel: jest.fn(),
    ...options.options
  },
  ...options
});

global.mockClient = (options = {}) => ({
  user: {
    id: '111222333',
    username: 'TestBot',
    tag: 'TestBot#0001',
    ...options.user
  },
  guilds: {
    cache: new Map([
      ['987654321', { id: '987654321', name: 'Test Guild' }]
    ]),
    ...options.guilds
  },
  commands: new Map(),
  events: new Map(),
  ...options
});

// Global test data
global.testPlayerData = {
  valid: {
    name: 'Test Player',
    dwz: 1500,
    club: 'Test Chess Club',
    tournaments: [
      {
        name: 'Test Tournament 1',
        date: '2024-01-15',
        dwz_before: 1480,
        dwz_after: 1500,
        performance: 1520
      }
    ]
  },
  multiple: [
    {
      name: 'Hans Müller',
      dwz: 1600,
      club: 'SC Berlin'
    },
    {
      name: 'Hans Müller',
      dwz: 1400,
      club: 'SK München'
    }
  ]
};

// Mock axios for HTTP requests
jest.mock('axios');

// Mock fs operations
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

// Set test timeout
jest.setTimeout(30000);
