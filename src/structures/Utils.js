// @ts-nocheck
/** 
 * @typedef {import("../Cluster")} Client 
 * @typedef {import("eris").Message} Message
 * @typedef {import("../structures/UserEntry")} UserEntry
 * @typedef {import("../structures/GuildEntry")} GuildEntry
*/

module.exports = class Utils {
    /**
     * Creates an instance of Utils.
     * @param {Client} client The client instance
     */
    constructor(client) {
        this.client = client;
    }

    /**
   * Performs a deep merge of the two given object, the behavior of this merge being the same as RethinkDB's `update`/`merge` methods
   * @param {Object} target - The object that should be updated with the source
   * @param {Object} source - The object that will be merged on the `target` object
   * @returns {Object} The merged object
   */
    deepMerge (target, source) {
        let destination = {};
        for (const key of Object.keys(target)) {
            destination[key] = (typeof target[key] === 'object' && !Array.isArray(target[key])) ? { ...target[key] } : target[key];
        }

        for (const key of Object.keys(source)) {
            if (!target[key] || typeof target[key] !== 'object' || Array.isArray(source[key])) {
                destination[key] = source[key];
            } else {
                if (typeof source[key] !== 'object') {
                    destination[key] = source[key];
                } else {
                    destination[key] = this.deepMerge(target[key], source[key]);
                }
            }
        }
        return destination;
    }

    /**
     * Parse flags
     * @param {Array<String>} args - An array of arguments to parse flags from
     * @returns {Object} An object following the structure { `argName`: `value` }
     */
    parseFlags(args) {
        const parsedFlags = {};
        args.forEach(arg => {
            if (!arg.includes('--')) {
                return;
            }
            parsedFlags[arg.split('--')[1].split('=')[0].toLowerCase()] = arg.includes('=') ? arg.split('=')[1] : true;
        });
        return parsedFlags;
    }

    /**
     *
     *
     * @param {Array<String>} args - An array of arguments to parse parameters from
     * @param {*} command - The invoked command
     * @returns {Object} An object following the structure { `argName`: `value` }
     */
    parseParams(args, command) {
        if (command.expectedArgs) {
            const expectedArgs = command.expectedArgs.split(/\s+/);
            const parsedArgs = {};
            for (let i = 0; i < args.length; i++) {
                if (expectedArgs[i] && !args[i].startsWith('--')) {
                    parsedArgs[expectedArgs[i]] = args[i];
                }
            }
            return parsedArgs;
        }
    }

    /**
     *
     *
     * @param {Array<String>} args The args to parse
     * @param {*} command The command
     * @returns {Object} An object following the structure { `argName`: `value` }
     */
    parseArgs(args, command) {
        const parsedParams = this.parseParams(args, command);
        const parsedFlags = this.parseFlags(args);
        return { ...parsedParams, ...parsedFlags };
    }

    /**
     * Check if a message calls for a command
     * As it calls the database to check for a custom prefix, the method is asynchronous and may be awaited
     * @param {Message} message - The message object to parse the command from
     * @returns {Promise<object | undefined>} - The command object, or undefined if the message is not prefixed or the command does not exist
     */
    async parseCommand(message) {
        const args = message.content.split(/\s+/);
        // @ts-ignore
        const guildEntry = message.channel.guild && this.client.handlers.DatabaseWrapper && this.client.handlers.DatabaseWrapper.healthy ?
        // @ts-ignore
            await this.client.db.getGuild(message.channel.guild.id) : false;
        let prefixes = [...this.client.prefixes]; //Clone this.client.prefixes to not modify it
        let prefix = args[0];
        let command = args[1];
        if (guildEntry && guildEntry.prefix) {
            if (!guildEntry.spacedPrefix) {
                const unspacedParsing = this._parseUnspacedCommand(message, guildEntry, args);
                prefix = unspacedParsing.prefix;
                command = unspacedParsing.command;
            }
            prefixes.push(guildEntry.prefix);
            prefixes = prefixes.filter(p => (guildEntry.spacedPrefix && p !== this.client.config.prefix) || !guildEntry.spacedPrefix);
        }
        if (!prefixes.find(p => p === prefix)) {
            return undefined;
        } else if (!command) {
            return undefined;
        }
        return this.client.commands.get(command.toLowerCase()) || this.client.commands.get(this.client.aliases.get(command.toLowerCase()));
    }

    /**
     *
     *
     * @param {Message} message message
     * @param {GuildEntry} guildEntry guildEntry
     * @param {Array<String>} args args
     * @returns {{prefix: String, command: String}} unspaced command
     * @memberof Command
     */
    _parseUnspacedCommand(message, guildEntry, args) {
        const mentionTest = message.content.startsWith(`<@${this.client.bot.user.id}>`) || message.content.startsWith(`<@!${this.client.bot.user.id}`);
        const supposedCommand = !mentionTest
            ? args.shift().slice(guildEntry.getPrefix.length).toLowerCase()
            : (args[1] ? args[1].toLowerCase() : false);
        const prefix = !mentionTest ? message.content.substr(0, guildEntry.getPrefix.length) : args[0];
        return {
            prefix,
            command: supposedCommand
        };
    }
};