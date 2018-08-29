/** @typedef {import("../../main.js")} Client */
/** @typedef {import("../../handlers/economyManager.js")} EconomyManager */
/** @typedef {import("../ExtendedStructures/extendedUserEntry.js")} UserEntry */

/** @typedef {Object} ConditionalVariantContext
 * @prop {String} success The description of the variant when it succeed
 * @prop {String} fail The description of the variant when it failed
 * @prop {Number} successRate The percentage of chances this variant can succeed
 */

/** @typedef {Object} ConditionalVariant
 * @prop {Function} condition The condition for this event to happen, this should be called like `.condition(<ExtendedUserEntry>)` with the extended instance of the user's database entry
 * @prop {String} [success] The description of the variant when it succeed. This won't be present if `context` is present
 * @prop {String} [fail] The description of the variant when it failed. This won't be present if `context` is present
 * @prop {Number} [successRate] The percentage of chances this variant can succeed. This won't be present if `context` is present
 * @prop {ConditionalVariantContext} [context] A function to call like `.context(<UserEntry>)` with the user's database entry that will return the `success`, `fail` and `successRate` properties
 */

/** @typedef {Object} CommonEvent
 * @prop {Number} id The ID of the event
 * @prop {String} message The description of the event
 * @prop {Array<Number>} changeRate An array containing two numbers, the two representing the percentage range this event can affect the gains
 * @prop {Array<ConditionalVariant>} conditionalVariants An array of conditional variants this event has
 */


/**
 * Provides events that are common to slots and daily
 * @param {Client} client client
 * @param {EconomyManager} economyManager economyManager
 * @returns {Array<SlotsEvent>} slot events
 */
const commonEvents = (client, economyManager) => {
    return [{
        id: 10000,
        message: 'A cat runs into you and steals \`{value}\` holy coins from your gains !',
        changeRate: [-40, -60],
        conditionalVariants: [{
            /** 
             * @param {UserEntry} userEntry userEntry
             * @returns {Boolean} true / false
            */
            condition: (userEntry) => userEntry.hasItem(1000),
            success: `But... A cat runs into you and steals \`{value}\` holy coins from your gains ! But your ${economyManager.getItem(1000).name} catches it and gets your gains back !`,
            fail: `A cat runs into you and steals \`{value}\` holy coins from your gains ! But your ${economyManager.getItem(1000).name} catches it and... wait, your ${economyManager.getItem(1000).name} got beaten by the cat !`,
            successRate: 85
        }],
        case: 'won'
    }, {
        id: 10002,
        message: 'A pirate ship attack and steals `{value}` from your gains!',
        changeRate: [-60, -80],
        conditionalVariants: [{
            condition: (userEntry) => userEntry.economy.items.find(i => economyManager.getItem(i.id).data && economyManager.getItem(i.id).data.type === 'Destroyer'),
            context: (userEntry) => commonNavalContext('torpedoes hit their broadside and sink the ship. Those torpedoes were from your', 'Destroyer', '', client, economyManager, userEntry)
        }, {
            condition: (userEntry) => userEntry.economy.items.find(i => economyManager.getItem(i.id).data && economyManager.getItem(i.id).data.type === 'Battleship'),
            context: (userEntry) => commonNavalContext('you hear loud gun fires and notice that they come from your', 'Battleship', 'Her main battery guns instantly sank the pirate ship', client, economyManager, userEntry)
        }],
        case: 'won'
    }];
};

function commonNavalContext(intro, type, ending, client, economyManager, userEntry) {
    return {
        success: `A pirate ship is suspiciously approaching the coast, but as soon as their intent to steal you becomes clear, ${intro} **${economyManager.marketItems.filter(i => i.data && i.data.type === type && userEntry.hasItem(i.id))[client.utils.getRandomNumber(0, economyManager.marketItems.filter(i => i.data && i.data.type === type && userEntry.hasItem(i.id)).length - 1)].name}** ! ${ending}`,
        fail: '',
        successRate: 100
    };
}

module.exports = commonEvents;