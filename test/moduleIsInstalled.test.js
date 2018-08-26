/* eslint-disable no-undef */

const moduleIsInstalled = require('../utils/moduleIsInstalled');
const assert = require('assert').strict;

describe('moduleIsInstalled()', function() {
    it('Should return true if the given module is installed and false otherwise', function() {
        assert.equal(moduleIsInstalled("baguette"), false);
        assert.equal(moduleIsInstalled("mocha"), true);
    });
});
