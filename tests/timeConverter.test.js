/* eslint-disable no-undef */

const timeConverter = require('../util/modules/timeConverter');

expect.extend({
    toBeType(received, argument) {
      const pass = typeof received === argument;
      return {
          message: () => `expected ${received} to be of type ${argument}`,
          pass: pass,
      };
    },
});

test('Returns the expected models', () => {
    expect(timeConverter.toElapsedTime(1)).toMatchObject({
        days: expect.toBeType('number'),
        hours: expect.toBeType('number'),
        minutes: expect.toBeType('number'),
        seconds: expect.toBeType('number')
    });
    expect(timeConverter.toHumanDate(1, false)).toMatchObject({
        seconds: expect.toBeType('number'),
        minutes: expect.toBeType('number'),
        hours: expect.toBeType('number'),
        day: expect.toBeType('number'),
        month: expect.toBeType('string'),
        year: expect.toBeType('number'),
    });
});