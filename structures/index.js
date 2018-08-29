/** @typedef {Object} Structures
 * @prop {import("./ExtendedStructures/ExtendedUser.js")} ExtendedUser An extended eris user
 * @prop {import("./ExtendedStructures/ExtendedMessage.js").ExtendedMessage} ExtendedMessage An extended eris message
 * @prop {import("./ExtendedStructures/ExtendedUserEntry")} ExtendedUserEntry An extended user database entry
 * @prop {import("./ExtendedStructures/ExtendedGuildEntry")} ExtendedGuildEntry An extended guild database entry
 * @prop {import("./CommandCategories/MusicCommands.js")} MusicCommands The MusicCommands category
 * @prop {import("./HandlersStructures/MusicConnection.js")} MusicConnection The MusicConnection class
 * @prop {import("./References.js").References} References The generic data models references
 * @prop {import("./HandlersStructures/TableInterface.js")} TableInterface The rethink table interface
 * @prop {import("./Contexts/BaseContext.js")} BaseContext The base context for all commands
 * @prop {Array<import("./HandlersStructures/dailyEvents.js").DailyEvent>} dailyEvents An array representing the existing daily events
 * @prop {Array<import("./HandlersStructures/marketItems.js").MarketItem>} marketItems An array representing the existing market items
 * @prop {Array<import("./HandlersStructures/slotsEvents.js").SlotsEvent>} slotsEvents An array representing the existing slots events
 * @prop {Array<import("./HandlersStructures/commonEvents.js").CommonEvent>} commonEvents An array providing events common to daily and slots
 */

module.exports = {
    ExtendedUser: require('./ExtendedStructures/ExtendedUser.js'),
    ExtendedUserEntry: require('./ExtendedStructures/ExtendedUserEntry.js'),
    ExtendedGuildEntry: require('./ExtendedStructures/ExtendedGuildEntry.js'),
    ExtendedMessage: require('./ExtendedStructures/ExtendedMessage'),
    MusicCommands: require('./CommandCategories/MusicCommands.js'),
    MusicConnection: require('./HandlersStructures/MusicConnection.js'),
    //Backward compatibility
    refs: require('./References.js'),
    References: require('./References.js'),
    TableInterface: require('./HandlersStructures/TableInterface.js'),
    BaseContext: require('./Contexts/BaseContext.js'),
    dailyEvents: require('./HandlersStructures/dailyEvents.js'),
    marketItems: require('./HandlersStructures/marketItems.js'),
    slotsEvents: require('./HandlersStructures/slotsEvents.js'),
    commonEvents: require('./HandlersStructures/commonEvents.js')
};