/* eslint-disable no-undef */

const timeConverter = require('../utils/TimeConverter');
const assert = require('assert').strict;

describe('TimeConverter', function () {
    describe('#toElapsedTime()', function () {
        it('Should return the expected object structure', function () {
            assert.deepEqual(timeConverter.toElapsedTime(0), {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0
            });
        });

        it("typeof non-readable format", () => {
            assert.deepEqual(typeof timeConverter.toElapsedTime(1934329731689, true), "string");
        });
    });
    
    describe('#toHumanDate()', function () {
        it('Should return the expected object structure', function () {
            assert.deepEqual(timeConverter.toHumanDate(0, false), {
                seconds: 0,
                minutes: 0,
                hours: timeConverter.toHumanDate(0, false).hours === 0 ? 0 : 1,
                day: 1,
                month: "January",
                year: 1970,
            });
        });
        
        it('typeof toHumanDate() formatted string', function () {
            assert.deepEqual(typeof timeConverter.toHumanDate(1534249942186, true), "string");
        });
    });

    describe('#getMonth()', function () {
        it('get month name getMonth()', function () {
            assert.deepEqual(timeConverter.getMonth(new Date(1934329731689)), "April");
        });
    });
});