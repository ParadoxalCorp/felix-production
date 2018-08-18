/**
 * Provides some utility methods to parse time
 * @typedef {TimeConverter} TimeConverter
 */
class TimeConverter {
    constructor() { }

    /**
     * @typedef {object} ElapsedTime 
     * @property {number} elapsedTime.days - Number of days elapsed with the given milliseconds
     * @property {number} elapsedTime.hours - Number of hours elapsed with the given milliseconds
     * @property {number} elapsedTime.minutes - Number of minutes elapsed with the given milliseconds
     * @property {number} elapsedTime.seconds - Number of seconds elapsed with the given milliseconds
     */

    /**
     * @typedef {object} HumanDate 
     * @property {number} seconds - The second
     * @property {number} minutes - The minute
     * @property {number} hours - The hour
     * @property {number} day - The day
     * @property {string} month - The month
     * @property {number} year - The year
     */

    /**
     * Calculate and return how many elapsed seconds, minutes, hours and days the given milliseconds represent
     * @param {number} ms The milliseconds to calculate
     * @param {boolean} [formatted=false] Whether or not the elapsed time should be returned already in a readable string format
     * @returns {ElapsedTime | string} An object or a string depending on if formatted is true or false
     */
    toElapsedTime(ms, formatted = false) {
        return formatted ? `${Math.floor((ms / (60 * 60 * 24 * 1000)))}d ${Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h ${Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))}m ${Math.floor((ms % (1000 * 60)) / 1000)}s` : {
            days: Math.floor((ms / (60 * 60 * 24 * 1000))),
            hours: Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((ms % (1000 * 60)) / 1000)
        };
    }

    /**
     * @param {any} Date new Date(timestamp)
     * @returns {String} month in string
     * @memberof TimeConverter
     */
    getMonth(Date) {
        return new Intl.DateTimeFormat('en-DE', { month: 'long' }).format(Date);
    }

    /**
     * Convert a UNIX timestamp(in ms) to human date
     * @param {number} timestamp The UNIX timestamp in ms to convert
     * @param {boolean} [formatted=true] Whether or not the date should be returned already in a readable string format
     * @returns {HumanDate | string} An object or a string depending on if formatted is true or false
     */
    toHumanDate(timestamp, formatted = true) {

        let date = new Date(timestamp);
        return formatted ? `${date.getDate()} ${this.getMonth(date)} ${date.getFullYear()}, ${new String(date.getHours()).length < 2 ? "0" + date.getHours() : date.getHours()}:${new String(date.getMinutes()).length < 2 ? "0" + date.getMinutes() : date.getMinutes()}:${new String(date.getSeconds()).length < 2 ? "0" + date.getSeconds() : date.getSeconds()}` : {
            seconds: date.getSeconds(),
            minutes: date.getMinutes(),
            hours: date.getHours(),
            day: date.getDate(),
            month: this.getMonth(date),
            year: date.getFullYear()
        };
    }

}

module.exports = new TimeConverter();