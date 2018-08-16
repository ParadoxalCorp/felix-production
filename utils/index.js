/**
 * @typedef {import("../main.js")} Client
 */

 /**
 * @typedef Utils
 * @property {import("./log.js").Log} log Custom logger module 
 * @property {import("./timeConverter.js").TimeConverter} timeConverter Provides methods to parse UNIX timestamps
 * @property {import("./sleep.js").sleep} sleep Reproduce PHP's sleep function
 * @property {import("./getRandomNumber.js").getRandomNumber} getRandomNumber Get a random integer between the specified interval
 * @property {import("./utils.js")} utils Some utility methods 
 * @property {import("./paginate.js").paginate} paginate Split an array into multiples, used for pagination purposes
 * @property {import("./traverse.js").traverse} traverse Traverse through a given object 
 * @property {import("./prompt.js").prompt} prompt Create a prompt in the command-line 
 * @property {import("./isWholeNumber.js").isWholeNumber} isWholeNumber Check if the given number is a whole number
 * @property {import("./moduleIsInstalled.js").moduleIsInstalled} moduleIsInstalled Checks if the specified module is installed in node_modules
 */

/**
 * @param {Client} client client
 * @returns {Object} object of modules
 */
module.exports = (client) => {
    return {
        //In case of a complete reload of the modules, ignore the critical modules
        log: require('./log'),
        timeConverter: require('./TimeConverter.js'),
        sleep: require('./sleep.js'),
        getRandomNumber: require('./getRandomNumber'),
        paginate: require('./paginate'),
        traverse: require('./traverse'),
        prompt: require('./prompt'),
        isWholeNumber: require('./isWholeNumber'),
        moduleIsInstalled: require('./moduleIsInstalled'),
        utils: new(require('./utils'))(client)
    };
};
