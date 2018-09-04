/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("../Contexts/SettingsContext")} SettingsContext
* @typedef {import("eris").Message} Message
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
     * @param {String} feature - The type of the feature to enable, either `greetings`, `farewells` or `experience`
     * @param {String} toggle - Either `disable` or `enable`
     * @param {SettingsContext} context - The context
     * @returns {Promise<Message>} The message confirming the success of the action
     */
    async toggleFeature(feature, toggle, context) {
        const enable = toggle === "enable" ? true : false;
        if (enable ? !context.guildEntry[feature].enabled : context.guildEntry[feature].enabled) {
            context.guildEntry[feature].enabled = enable;
            await context.guildEntry.save();
            if (enable) {
                return context.message.channel.createMessage(`:white_check_mark: Alright, the ${feature} feature is now enabled. Make sure to also set up a ${feature} message and the target`);
            } else {
                return context.message.channel.createMessage(`:white_check_mark: Alright, the ${feature} is now disabled`);
            }
        } else {
            return context.message.channel.createMessage(`:x: The ${feature} feature is already ${toggle}d`);
        }
    }

    /**
     * @param {String} feature - The feature to set the message for, can be either `greetings` or `farewells`
     * @param {SettingsContent} context - The context
     * @returns {Promise<Message>} The message confirming the success of the action
     */
    async setMessage(feature, context) {
        if (!context.args[1]) {
            return context.message.channel.createMessage(`:x: You must specify the new ${feature} message to use`);
        }
        context.guildEntry[feature].message = context.args[2]
            ? context.args.splice(1).join(" ")
            : context.args[1];
        await context.guildEntry.save();
        return context.message.channel.createMessage(`:white_check_mark: Alright, the ${feature} message has been updated`);
    }
}

module.exports = SettingsCommands;