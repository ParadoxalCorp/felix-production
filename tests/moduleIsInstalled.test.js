/* eslint-disable no-undef */

const moduleIsInstalled = require('../util/modules/moduleIsInstalled');

test('Returns false if the specified module is not installed and true if it is', () => {
    expect(moduleIsInstalled("baguette")).toBe(false);
    expect(moduleIsInstalled("jest")).toBe(true);
});