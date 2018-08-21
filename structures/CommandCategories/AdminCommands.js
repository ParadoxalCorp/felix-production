/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
*/

const AdminContext = require('../Contexts/AdminContext');
const { inspect } = require('util');
const Command = require('../Command');

class GenericCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string}} [options]  - `noArgs` specify a message to return if no arguments are provided.
     *  These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Admin',
            conf: {
                hidden: true
            },
            emote: 'heart'
        }});
        this.options = options;
    }

    //eslint-disable-next-line no-unused-vars
    async initialCheck(client, message, args, guildEntry, userEntry) {
        if (this.options.noArgs && !args[0]) {
            return message.channel.createMessage(this.options.noArgs);
        }
        return { 
            passed: true,
            context: new AdminContext(client, message, args, guildEntry, userEntry)
        };
    }

    /**
     * Parse CLI-like arguments
     * @param {Array<String>} args - The arguments to parse
     * @returns {Object} An object following the structure { `argName`: `value` }
     */
    parseArguments(args) {
        const parsedArgs = {};
        args.forEach(arg => {
            if (!arg.includes('--')) {
                return;
            }
            parsedArgs[arg.split('--')[1].split('=')[0].toLowerCase()] = arg.includes('=') ? arg.split('=')[1] : true;
        });
        return parsedArgs;
    }

    /**
     * Get the max depth at which an element can be inspected according to discord's regular message limit
     * @param {*} toInspect - The element to inspect
     * @param {String} [additionalText] - An additional text that should be taken into account
     * @returns {Number} The max depth
     */
    getMaxDepth(toInspect, additionalText = "") {
        let maxDepth = 0;
        for (let i = 0; i < 10; i++) {
            if (inspect(toInspect, { depth: i }).length > (1950 - additionalText.length)) {
                return i - 1;
            } else {
                maxDepth++;
            }
        }
        return maxDepth;
    }
}

module.exports = GenericCommands;