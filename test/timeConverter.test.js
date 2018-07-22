/* eslint-disable no-undef */

const timeConverter = require('../util/modules/timeConverter');
const assert = require('assert').strict;

describe('TimeConverter', function() {
    describe('#toElapsedTime()', function() {
        it('Should return the expected object structure', function() {
            assert.deepEqual(timeConverter.toElapsedTime(0), {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0
            });
        });
    });
    describe('#toHumanDate()', function() {
        it('Should return the expected object structure', function() {
            assert.deepEqual(timeConverter.toHumanDate(0, false), {
                seconds: 0,
                minutes: 0,
                hours: timeConverter.toHumanDate(0, false).hours === 0 ? 0 : 1,
                day: 1,
                month: "January",
                year: 1970,
            });
        });
    });
});