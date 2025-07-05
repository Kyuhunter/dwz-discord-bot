/**
 * Unit Tests for Validators Module
 */

const validators = require('../../src/validators');

describe('Validators Module', () => {
  describe('validatePlayerName', () => {
    test('should validate valid player names', () => {
      expect(validators.validatePlayerName('Hans Müller').isValid).toBe(true);
      expect(validators.validatePlayerName('Schmidt').isValid).toBe(true);
      expect(validators.validatePlayerName('van der Berg').isValid).toBe(true);
      expect(validators.validatePlayerName("O'Connor").isValid).toBe(true);
      expect(validators.validatePlayerName('José María').isValid).toBe(true);
      expect(validators.validatePlayerName('李小明').isValid).toBe(true); // Chinese characters
    });

    test('should reject invalid player names', () => {
      expect(validators.validatePlayerName('').isValid).toBe(false);
      expect(validators.validatePlayerName('   ').isValid).toBe(false);
      expect(validators.validatePlayerName(null).isValid).toBe(false);
      expect(validators.validatePlayerName(undefined).isValid).toBe(false);
      expect(validators.validatePlayerName(123).isValid).toBe(false);
      expect(validators.validatePlayerName('a').isValid).toBe(false); // Too short
      expect(validators.validatePlayerName('a'.repeat(101)).isValid).toBe(false); // Too long
    });

    test('should handle special characters appropriately', () => {
      expect(validators.validatePlayerName('Hans-Peter').isValid).toBe(true);
      expect(validators.validatePlayerName('Anne-Marie').isValid).toBe(true);
      expect(validators.validatePlayerName('Dr. Schmidt').isValid).toBe(true);
      expect(validators.validatePlayerName('Müller, Hans').isValid).toBe(true);
      
      // Invalid special characters
      expect(validators.validatePlayerName('Test@Name').isValid).toBe(false);
      expect(validators.validatePlayerName('Test#Name').isValid).toBe(false);
      expect(validators.validatePlayerName('Test$Name').isValid).toBe(false);
    });
  });

  describe('validateDWZRating', () => {
    test('should validate valid DWZ ratings', () => {
      expect(validators.validateDWZRating(800)).toBe(true);
      expect(validators.validateDWZRating(1000)).toBe(true);
      expect(validators.validateDWZRating(1500)).toBe(true);
      expect(validators.validateDWZRating(2000)).toBe(true);
      expect(validators.validateDWZRating(2500)).toBe(true);
      expect(validators.validateDWZRating(2800)).toBe(true);
    });

    test('should reject invalid DWZ ratings', () => {
      expect(validators.validateDWZRating(null)).toBe(false);
      expect(validators.validateDWZRating(undefined)).toBe(false);
      expect(validators.validateDWZRating('1500')).toBe(false);
      expect(validators.validateDWZRating(NaN)).toBe(false);
      expect(validators.validateDWZRating(Infinity)).toBe(false);
      expect(validators.validateDWZRating(-100)).toBe(false);
      expect(validators.validateDWZRating(799)).toBe(false); // Below minimum
      expect(validators.validateDWZRating(3001)).toBe(false); // Above maximum
    });

    test('should handle edge cases', () => {
      expect(validators.validateDWZRating(800)).toBe(true); // Minimum
      expect(validators.validateDWZRating(3000)).toBe(true); // Maximum
      expect(validators.validateDWZRating(799.9)).toBe(false); // Just below minimum
      expect(validators.validateDWZRating(3000.1)).toBe(false); // Just above maximum
    });
  });

  describe('validateClubName', () => {
    test('should validate valid club names', () => {
      expect(validators.validateClubName('Schachclub Berlin').isValid).toBe(true);
      expect(validators.validateClubName('SC München 1900').isValid).toBe(true);
      expect(validators.validateClubName('SV Werder Bremen').isValid).toBe(true);
      expect(validators.validateClubName('TSV 1860 München').isValid).toBe(true);
      expect(validators.validateClubName('FC St. Pauli').isValid).toBe(true);
    });

    test('should handle empty or null club names', () => {
      expect(validators.validateClubName('').isValid).toBe(true); // Empty is valid (no club)
      expect(validators.validateClubName(null).isValid).toBe(true);
      expect(validators.validateClubName(undefined).isValid).toBe(true);
    });

    test('should reject invalid club names', () => {
      expect(validators.validateClubName(123).isValid).toBe(false);
      expect(validators.validateClubName([]).isValid).toBe(false);
      expect(validators.validateClubName({}).isValid).toBe(false);
      expect(validators.validateClubName('a'.repeat(201)).isValid).toBe(false); // Too long
    });
  });

  describe('validateTournamentName', () => {
    test('should validate valid tournament names', () => {
      expect(validators.validateTournamentName('Berliner Einzelmeisterschaft')).toBe(true);
      expect(validators.validateTournamentName('Open 2024')).toBe(true);
      expect(validators.validateTournamentName('Bundesliga 2023/24')).toBe(true);
      expect(validators.validateTournamentName('Schnellschach-Turnier')).toBe(true);
    });

    test('should reject invalid tournament names', () => {
      expect(validators.validateTournamentName('')).toBe(false);
      expect(validators.validateTournamentName('   ')).toBe(false);
      expect(validators.validateTournamentName(null)).toBe(false);
      expect(validators.validateTournamentName(undefined)).toBe(false);
      expect(validators.validateTournamentName(123)).toBe(false);
      expect(validators.validateTournamentName('a'.repeat(301))).toBe(false); // Too long
    });
  });

  describe('validateDateString', () => {
    test('should validate valid date strings', () => {
      expect(validators.validateDateString('2024-01-15')).toBe(true);
      expect(validators.validateDateString('2023-12-31')).toBe(true);
      expect(validators.validateDateString('2022-02-28')).toBe(true);
      expect(validators.validateDateString('15.01.2024')).toBe(true); // German format
      expect(validators.validateDateString('31.12.2023')).toBe(true);
    });

    test('should reject invalid date strings', () => {
      expect(validators.validateDateString('')).toBe(false);
      expect(validators.validateDateString(null)).toBe(false);
      expect(validators.validateDateString(undefined)).toBe(false);
      expect(validators.validateDateString('invalid-date')).toBe(false);
      expect(validators.validateDateString('2024-13-01')).toBe(false); // Invalid month
      expect(validators.validateDateString('2024-01-32')).toBe(false); // Invalid day
      expect(validators.validateDateString('32.01.2024')).toBe(false); // Invalid day (German)
      expect(validators.validateDateString('01.13.2024')).toBe(false); // Invalid month (German)
    });

    test('should handle different date formats', () => {
      expect(validators.validateDateString('01/15/2024')).toBe(true); // US format
      expect(validators.validateDateString('15/01/2024')).toBe(true); // UK format
      expect(validators.validateDateString('2024/01/15')).toBe(true); // ISO-like format
    });
  });

  describe('validateSearchQuery', () => {
    test('should validate valid search queries', () => {
      expect(validators.validateSearchQuery('Müller')).toBe(true);
      expect(validators.validateSearchQuery('Hans Schmidt')).toBe(true);
      expect(validators.validateSearchQuery('van der Berg')).toBe(true);
    });

    test('should reject invalid search queries', () => {
      expect(validators.validateSearchQuery('')).toBe(false);
      expect(validators.validateSearchQuery('   ')).toBe(false);
      expect(validators.validateSearchQuery('a')).toBe(false); // Too short
      expect(validators.validateSearchQuery('a'.repeat(101))).toBe(false); // Too long
      expect(validators.validateSearchQuery(null)).toBe(false);
      expect(validators.validateSearchQuery(undefined)).toBe(false);
    });
  });

  describe('validatePlayerData', () => {
    test('should validate complete player data', () => {
      const validPlayer = {
        name: 'Hans Müller',
        dwz: 1500,
        club: 'SC Berlin',
        tournaments: [
          {
            name: 'Test Tournament',
            date: '2024-01-15',
            dwz_before: 1480,
            dwz_after: 1500
          }
        ]
      };

      expect(validators.validatePlayerData(validPlayer)).toBe(true);
    });

    test('should validate minimal player data', () => {
      const minimalPlayer = {
        name: 'Hans Müller'
      };

      expect(validators.validatePlayerData(minimalPlayer)).toBe(true);
    });

    test('should reject invalid player data', () => {
      expect(validators.validatePlayerData(null)).toBe(false);
      expect(validators.validatePlayerData(undefined)).toBe(false);
      expect(validators.validatePlayerData({})).toBe(false); // No name
      expect(validators.validatePlayerData({ name: '' })).toBe(false); // Empty name
      expect(validators.validatePlayerData({ name: 'Test', dwz: 'invalid' })).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    test('should sanitize user input', () => {
      expect(validators.sanitizeInput('  Hans Müller  ')).toBe('Hans Müller');
      expect(validators.sanitizeInput('Hans\tMüller')).toBe('Hans Müller');
      expect(validators.sanitizeInput('Hans\nMüller')).toBe('Hans Müller');
      expect(validators.sanitizeInput('Hans\r\nMüller')).toBe('Hans Müller');
    });

    test('should handle special characters', () => {
      expect(validators.sanitizeInput('Hans-Peter')).toBe('Hans-Peter');
      expect(validators.sanitizeInput("O'Connor")).toBe("O'Connor");
      expect(validators.sanitizeInput('José María')).toBe('José María');
    });

    test('should handle null and undefined', () => {
      expect(validators.sanitizeInput(null)).toBe('');
      expect(validators.sanitizeInput(undefined)).toBe('');
    });
  });

  describe('isValidInteraction', () => {
    test('should validate Discord interactions', () => {
      const validInteraction = {
        reply: jest.fn(),
        user: { id: '123' },
        guild: { id: '456' }
      };

      expect(validators.isValidInteraction(validInteraction)).toBe(true);
    });

    test('should reject invalid interactions', () => {
      expect(validators.isValidInteraction(null)).toBe(false);
      expect(validators.isValidInteraction(undefined)).toBe(false);
      expect(validators.isValidInteraction({})).toBe(false);
      expect(validators.isValidInteraction({ reply: 'not a function' })).toBe(false);
    });
  });
});
