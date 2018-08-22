'use strict';

/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
*/

const GenericContext = require('../Contexts/GenericContext');

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
            name: 'Generic',
            emote: 'barChart'
        }});
        this.options = options;
    }
}

module.exports = GenericCommands;