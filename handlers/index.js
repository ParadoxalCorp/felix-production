/** @typedef {Object} Handlers
 * @prop {import("./DatabaseWrapper.js")} DatabaseWrapper The database wrapper
 * @prop {import("./EconomyManager.js")} EconomyManager The economy handler
 * @prop {import("./ExperienceHandler.js")} ExperienceHandler The experience handler
 * @prop {import("./ImageHandler.js")} ImageHandler The image handler
 * @prop {import("./InteractiveList.js")} InteractiveList The interactive list interface
 * @prop {import("./IPCHandler.js")} IPCHandler The IPC handler
 * @prop {import("./MessageCollector.js")} MessageCollector The message collector
 * @prop {import("./MusicManager.js")} MusicManager The music manager
 * @prop {import("./ReactionCollector.js")} ReactionCollector The reaction collector
 * @prop {import("./RedisManager.js")} RedisManager The redis handler
 * @prop {import("./Reloader.js")} Reloader The reload handler
 * @prop {import("./KitsuWrapper.js")} KitsuWrapper A wrapper for the Kitsu API
 */

module.exports = {
    DatabaseWrapper: require('./DatabaseWrapper.js'),
    EconomyManager: require('./EconomyManager.js'),
    ExperienceHandler: require('./ExperienceHandler.js'),
    ImageHandler: require('./ImageHandler.js'),
    InteractiveList: require('./InteractiveList.js'),
    IPCHandler: require('./IPCHandler.js'),
    MessageCollector: require('./MessageCollector.js'),
    MusicManager: require('./MusicManager.js'),
    ReactionCollector: require('./ReactionCollector.js'),
    RedisManager: require('./RedisManager.js'),
    Reloader: require('./Reloader.js'),
    KitsuWrapper: require('./KitsuWrapper')
};