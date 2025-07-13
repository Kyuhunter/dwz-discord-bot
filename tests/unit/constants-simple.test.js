/**
 * Simple Constants Test
 */

const constants = require('../../src/constants');

test('should load constants module', () => {
  expect(constants).toBeDefined();
  expect(constants.SUCCESS_MESSAGES).toBeDefined();
  expect(constants.ERROR_MESSAGES).toBeDefined();
});
