/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("eris").Role} Role
* @typedef {import("eris").TextChannel} TextChannel
* @typedef {import("../ExtendedStructures/ExtendedUser")} ExtendedUser
* @typedef {import("eris").CategoryChannel} CategoryChannel
*/

const Command = require('../Command');

class ModerationCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string}} [options]  - `noArgs` specify a message to return if no arguments are provided.
     *  These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Moderation',
            conf: {
                guildOnly: true
            },
            emote: 'hammerPick'
        }});
        this.options = options;
    }

    /**
     * Get a permission's target object
     * @param {ModerationContext} context - The context
     * @param {Number} [startsAt=0] - An optional parameter defining at what index is the target in the `args` array
     * @returns {TextChannel | Role | ExtendedUser | CategoryChannel} The target, or null if none is found
     */
    async getPermissionTarget(context, startsAt = 0) {
        let target = context.args[startsAt].toLowerCase() === 'global' ? 'global' : null;
        let targetType = context.args[startsAt].toLowerCase();
        if (['category', 'channel'].includes(targetType)) {
            target = await this.getChannelFromText({client: context.client, message: context.message, text: context.args.slice(startsAt + 1).join(' '), type: targetType === 'channel' ? 'text' : 'category'});
        } else if (targetType === 'role') {
            target = await this.getRoleFromText({client: context.client, message: context.message, text: context.args.slice(startsAt + 1).join(' ')});
        } else if (targetType === 'user') {
            target = await this.getUserFromText({client: context.client, message: context.message, text: context.args.slice(startsAt + 1).join(' ')});
        }
        return target;
    }

    /**
     * Checks if a given string is a valid permission permission target
     * @param {String} arg - The string to validate
     * @returns {Boolean} Whether the given string is a valid permission target
     */
    validatePermissionTarget(arg) {
        return arg ? ['global', 'category', 'channel', 'role', 'user'].includes(arg.toLowerCase()) : false;
    }

    /**
     * Checks if a given string is a valid permission
     * @param {String} arg - The string on which to perform the check
     * @returns {Boolean} Whether the given string is a valid permission
     */
    validatePermission(arg) {
        let categories = [];
        arg = arg ? arg.toLowerCase() : '';
        //eslint-disable-next-line no-unused-vars
        for (const [key, command] of this.client.commands) {
            if (!categories.includes(command.category.name) && command.category.name !== 'admin') {
                categories.push(`${command.category.name.toLowerCase()}*`);
            } 
        }
        let command = this.client.commands.get(arg) || this.client.commands.get(this.client.aliases.get(arg));
        if (command && command.category.name === 'admin') {
            return false;
        }
        return (!command && !categories.includes(arg) && arg !== '*') ? false : true;
    }

}

module.exports = ModerationCommands;