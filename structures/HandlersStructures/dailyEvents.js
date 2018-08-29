/** @typedef {import("../../main.js")} Client 
 * @typedef {import("../../handlers/economyManager.js")} EconomyManager 
 * @typedef {import("../ExtendedStructures/extendedUserEntry.js")} UserEntry
 * @typedef {import("./commonEvents").CommonEvent} DailyEvent
 */

/**
 * 
 * @param {Client} client client
 * @param {EconomyManager} economyManager economyManager
 * @returns {Array<DailyEvent>} daily events
 */
const dailyEvents = (client, economyManager) => {
    return [...require('./commonEvents')(client, economyManager), {
        id: 20000,
        message: 'I forgot how much i have to give you, well here\'s something',
        changeRate: [-30, -40],
        conditionalVariants: [],
    }, {
        id: 20001,
        message: 'I forgot how much i have to give you, well here\'s something',
        changeRate: [30, 40],
        conditionalVariants: [],
    }];
};

module.exports = dailyEvents;