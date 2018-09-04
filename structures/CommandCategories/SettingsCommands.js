/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("../Contexts/SettingsContext")} SettingsContext
*/

const Command = require('../Command');

class SettingsCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string}} [options]  - `noArgs` specify a message to return if no arguments are provided.
     * These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Settings',
            emote: 'gear',
            conf: {
                requireDB: true,
                guildOnly: true
            }
        }});
        this.options = options;
    }

    /**
     * 
     * @param {String} type - The type of the feature to enable, either `greetings` or `farewells` 
     * @param {String} toggle - Either `disable` or `enable`
     * @param {SettingsContext} context - The context
     * @returns {Promise<any>} A promise
     */
    async toggleGreetingsOrFarewells(type, toggle, context) {
        const enable = toggle === "enable" ? true : false;
        if (enable ? !context.guildEntry[type].enabled : context.guildEntry[type].enabled) {
            context.guildEntry[type].enabled = enable;
            await context.guildEntry.save();
            if (enable) {
                return context.message.channel.createMessage(`:white_check_mark: Alright, the ${type} are now enabled. Make sure to also set up a ${type} message and the target`);
            } else {
                return context.message.channel.createMessage(`:white_check_mark: Alright, the ${type} are now disabled`);
            }
        } else {
            return context.message.channel.createMessage(`:x: The ${type} are already ${toggle}d`);
        }
    }
}

module.exports = SettingsCommands;