/* eslint-disable no-undef */

const timeConverter = require('../util/modules/timeConverter');
const assert = require('assert').strict;
const os = require("os")

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
    });

    describe('#toHumanDate()', function () {
        it('should give a formatted string', function () {
            if (os.platform() === "win32") {
                assert.deepEqual(timeConverter.toHumanDate(1534249942186, true), "14 August 2018, 14:32:22");
            } else {
                assert.deepEqual(timeConverter.toHumanDate(1534249942186, true), "14 August 2018, 13:32:22");
            }
        });
    });
});