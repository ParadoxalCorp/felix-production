/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("eris").Role} Role
* @typedef {import("eris").TextChannel} TextChannel
* @typedef {import("../ExtendedStructures/ExtendedUser")} ExtendedUser
* @typedef {import("eris").CategoryChannel} CategoryChannel
* @typedef {import("../Contexts/ModerationContext")} ModerationContext
* @typedef {import("../References").Permissions} Permissions
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
        this.specialTargetCases = {
            global: 'global',
            category: 'categories'
        };
    }

    /**
     * @param {ModerationContext} context - The client instance
     * @returns {Promise<Object>} The generic initial check's return value
     */
    async categoryCheck(context) {
        if (['setpermission', 'removepermission'].includes(this.help.name)) {
            if (context.args.length < (this.help.name === 'setpermission' ? 3 : 2)) {
                return context.message.channel.createMessage(`:x: You didn't specified enough arguments, if you are lost, just run \`${context.prefix}${this.help.name}\``);
            }
            if (!this.validatePermission(context.args[0])) {
                return context.message.channel.createMessage(':x: The permission must be a command name, like `ping`, or the name of a command category followed by a `*` like `generic*` to target a whole category. If you are lost, simply run this command like `' + context.prefix + this.help.name + '`');
            } 
        }
        return { passed: true };
    }

    /**
     * Get a permission's target object
     * @param {ModerationContext} context - The context
     * @param {Number} [startsAt=0] - An optional parameter defining at what index is the target in the `args` array
     * @returns {Promise<TextChannel | Role | ExtendedUser | CategoryChannel>} The target, or null if none is found
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

    /**
     *
     *
     * @param {ModerationContext} context - The context
     * @param {{targetType: String, target: TextChannel|Role|ExtendedUser|CategoryChannel}} args - The args
     * @param {Boolean} [create=false] - Whether to create the permission group if it doesn't exist, defaults to `false`
     * @returns {Permissions} The target permissions
     * @memberof ModerationCommands
     */

    getTargetPerms(context, args, create = false) {
        let targetPerms = context.guildEntry.permissions[this.specialTargetCases[args.targetType] || `${args.targetType}s`];
        if (Array.isArray(targetPerms)) {
            if (create && !targetPerms.find(perms => perms.id === args.target.id)) {
                targetPerms.push(context.client.structures.References.permissionsSet(args.target.id));
            }
            targetPerms = targetPerms.find(perms => perms.id === args.target.id);
        }
        return targetPerms;
    }

}

module.exports = ModerationCommands;