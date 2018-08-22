/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
*/

const EconomyContext = require('../Contexts/EconomyContext');

const Command = require('../Command');

class EconomyCommands extends Command {
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
            emote: 'moneybag',
            conf: {
                requireDB: true
            }
        }});
        this.options = options;
    }
}

module.exports = EconomyCommands;