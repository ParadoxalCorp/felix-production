/* eslint-disable no-undef */

const getRandomNumber = require('../util/modules/getRandomNumber');
const assert = require('assert').strict;

describe('getRandomNumber()', function() {
    it('Should return a number of type number', function() {
        assert.equal(typeof getRandomNumber(0, 100), 'number');
    });
  });

