/* eslint-disable no-undef */

const isWholeNumber = require('../util/modules/isWholeNumber');
const assert = require('assert').strict;

describe('isWholeNumber()', function () {
    it('Should return true for a whole number and false for a non-whole number', function () {
        assert.equal(isWholeNumber(1), true);
        assert.equal(isWholeNumber(1.5), false);
        assert.equal(isWholeNumber("1.5"), false);
        assert.equal(isWholeNumber("1"), true);
    });
});
