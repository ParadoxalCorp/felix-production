/** @typedef {Object} Structures
 * @prop {import("./ExtendedStructures/ExtendedUser.js")} ExtendedUser An extended eris user
 * @prop {import("./CommandCategories/MusicCommands.js")} MusicCommands The MusicCommands category
 * @prop {import("./HandlersStructures/MusicConnection.js")} MusicConnection The MusicConnection class
 * @prop {import("./References.js").References} References The generic data models references
 * @prop {import("./HandlersStructures/TableInterface.js")} TableInterface The rethink table interface
 * @prop {import("./Contexts/BaseContext.js")} BaseContext The base context for all commands
 * @prop {import("./HandlersStructures/dailyEvents.js")} dailyEvents An object representing the existing daily events
 * @prop {import("./HandlersStructures/marketItems.js")} marketItems An object representing the existing market items
 * @prop {import("./HandlersStructures/slotsEvents.js")} slotsEvents An object representing the existing slots events
 */

module.exports = {
    ExtendedUser: require('./ExtendedStructures/ExtendedUser.js'),
    MusicCommands: require('./CommandCategories/MusicCommands.js'),
    MusicConnection: require('./HandlersStructures/MusicConnection.js'),
    //Backward compatibility
    refs: require('./References.js'),
    References: require('./References.js'),
    TableInterface: require('./HandlersStructures/TableInterface.js'),
    BaseContext: require('./Contexts/BaseContext.js'),
    dailyEvents: require('./HandlersStructures/dailyEvents.js'),
    marketItems: require('./HandlersStructures/marketItems.js'),
    slotsEvents: require('./HandlersStructures/slotsEvents.js')
};