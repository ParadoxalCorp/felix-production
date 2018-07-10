/* eslint-disable no-undef */

const isWholeNumber = require('../util/modules/isWholeNumber');

test('Returns false if not a whole number and true if a whole number', () => {
    expect(isWholeNumber(1.5)).toBe(false);
    expect(isWholeNumber(1)).toBe(true);
});