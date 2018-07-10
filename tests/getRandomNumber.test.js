/* eslint-disable no-undef */

const getRandomNumber = require('../util/modules/getRandomNumber');

expect.extend({
    toBeType(received, argument) {
      const pass = typeof received === argument;
      return {
          message: () => `expected ${received} to be of type ${argument}`,
          pass: pass,
      };
    },
  });

test('Returns a random number', () => {
    expect(getRandomNumber(0, 5)).toBeType('number');
});
