'use strict';

/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
*/

const EconomyContext = require('../Contexts/EconomyContext');

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
            name: 'Economy',
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
            context: new EconomyContext(client, message, args, guildEntry, userEntry)
        };
    }

}

module.exports = GenericCommands;