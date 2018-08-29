/** @typedef {import("../../main.js")} Client 
 * @typedef {import("../../handlers/economyManager.js")} EconomyManager 
 * @typedef {import("../ExtendedStructures/extendedUserEntry.js")} UserEntry 
 * @typedef {import("./commonEvents.js").CommonEvent} CommonEvent
 */

/** @typedef {Object} AdditionalData
 * @prop {String} case A string that can be either `lost` or `won`, representing in what case this event may happen
 */

/** @typedef {CommonEvent & AdditionalData} SlotsEvent */

/**
 * 
 * @param {Client} client client
 * @param {EconomyManager} economyManager economyManager
 * @returns {Array<SlotsEvent>} slot events
 */
const slotsEvents = (client, economyManager) => {
    return [...require('./commonEvents')(client, economyManager), {
        id: 10001,
        message: 'The slots machine seems to have pity of you, and gives you back \`{value}\` of your coins',
        changeRate: [40, 60],
        conditionalVariants: [],
        case: 'lost'
    },];
};

module.exports = slotsEvents;