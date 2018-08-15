/**
 * @typedef {import("../main.js")} Client
 */

 /**
 * @typedef Utils
 * @property {import("./helpers/modules/databaseWrapper.js")} database The database wrapper
 * @property {import("./helpers/data/references.js").References} refs Generic data models reference 
 * @property {import("./modules/log.js").Log} log Custom logger module 
 * @property {import("./modules/timeConverter.js").TimeConverter} timeConverter Provides methods to parse UNIX timestamps
 * @property {import("./helpers/modules/messageCollector.js")} messageCollector Used to await messages
 * @property {import("./helpers/modules/IPCHandler.js")} IPCHandler Handles inter-processes communication
 * @property {import("./modules/sleep.js").sleep} sleep Reproduce PHP's sleep function
 * @property {import("./helpers/modules/reloader.js")} reloader Handles reloads of commands, events listeners and modules
 * @property {import("./modules/getRandomNumber.js").getRandomNumber} getRandomNumber Get a random integer between the specified interval
 * @property {import("./helpers/modules/redact.js").redact} redact Censors the API Keys, passwords, IPs and other sensitive information in the config
 * @property {import("./helpers/modules/economyManager.js")} economyManager Provides methods to manage the economy
 * @property {import("./modules/paginate.js").paginate} paginate Split an array into multiples, used for pagination purposes
 * @property {import("./helpers/modules/reactionCollector.js")} reactionCollector Equivalent of the message collector for reactions
 * @property {import("./modules/traverse.js").traverse} traverse Traverse through a given object 
 * @property {import("./helpers/modules/interactiveList.js")} interactiveList Creates an interactive message for listing purposes
 * @property {import("./helpers/modules/extendedUser.js").extendUser} extendedUser Extends Eris's User class
 * @property {import("./helpers/modules/extendedUserEntry.js")} extendedUserEntry Add methods to make manipulating user entries more easily
 * @property {import("./helpers/modules/extendedGuildEntry.js")} extendedGuildEntry Add methods to make manipulating guild entries more easily
 * @property {import("./modules/prompt.js").prompt} prompt Create a prompt in the command-line 
 * @property {import("./modules/isWholeNumber.js").isWholeNumber} isWholeNumber Check if the given number is a whole number
 * @property {import("./helpers/modules/getLevelDetails.js").getLevelDetails} getLevelDetails Get the details about a specific activity level
 * @property {import("./helpers/modules/experienceHandler.js")} experienceHandler Manages the activity tracking system
 * @property {import("./modules/moduleIsInstalled.js").moduleIsInstalled} moduleIsInstalled Checks if the specified module is installed in node_modules
 * @property {import("./helpers/modules/imageHandler.js")} imageHandler Manage image sub-commands and such
 * @property {import("./helpers/modules/fetchUser.js")} fetchUser Fetch a user by their ID through the Discord's REST API
 * @property {import("./helpers/modules/musicManager.js")} musicManager Handles music connections and communication with the Lavalink nodes, as well as provide methods to interact with them
 * @property {import("./helpers/modules/redisManager.js")} redis Manages the connection with the Redis server
 */

/**
 * @param {Client} client client
 * @returns {Object} object of modules
 */
module.exports = (client) => {
    return {
        //In case of a complete reload of the modules, ignore the critical modules
        database: client.database ? client.database._reload() : (process.argv.includes('--no-db') ? false : new(require('./helpers/modules/databaseWrapper'))(client)),
        refs: require('./helpers/data/references'),
        log: require('./modules/log'),
        timeConverter: require('./modules/timeConverter.js'),
        messageCollector: new(require('./helpers/modules/messageCollector'))(client.bot),
        IPCHandler: client.IPCHandler ? client.IPCHandler._reload() : new(require('./helpers/modules/IPCHandler'))(client),
        sleep: require('./modules/sleep.js'),
        reloader: new(require('./helpers/modules/reloader'))(client),
        getRandomNumber: require('./modules/getRandomNumber'),
        redact: require('./helpers/modules/redact').bind(null, client),
        economyManager: new(require('./helpers/modules/economyManager'))(client),
        paginate: require('./modules/paginate'),
        reactionCollector: new(require('./helpers/modules/reactionCollector'))(client.bot),
        traverse: require('./modules/traverse'),
        interactiveList: new(require('./helpers/modules/interactiveList'))(client),
        extendedUser: require('./helpers/modules/extendedUser').bind(null, client),
        extendedUserEntry: require('./helpers/modules/extendedUserEntry'),
        extendedGuildEntry: require('./helpers/modules/extendedGuildEntry'),
        prompt: require('./modules/prompt'),
        isWholeNumber: require('./modules/isWholeNumber'),
        getLevelDetails: require('./helpers/modules/getLevelDetails').bind(null, client),
        experienceHandler: new(require('./helpers/modules/experienceHandler'))(client),
        moduleIsInstalled: require('./modules/moduleIsInstalled'),
        imageHandler: new(require('./helpers/modules/imageHandler'))(client),
        fetchUser: require('./helpers/modules/fetchUser').bind(null, client),
        musicManager: client.musicManager ? client.musicManager._reload() : new(require('./helpers/modules/musicManager'))(client),
        redis: require('./modules/moduleIsInstalled')('ioredis') ? (client.redis ? client.redis._reload() : new(require('./helpers/modules/redisManager'))(client)) : false
    };
};
