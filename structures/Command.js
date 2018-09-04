/**
 * @typedef {import("eris").Role} Role 
 * @typedef {import("eris").User} User
 * @typedef {import("eris").Member} Member
 * @typedef {import("eris").Guild} Guild
 * @typedef {import("eris").Channel} Channel
 * @typedef {import("eris").PermissionOverwrite} PermissionOverwrite
 * @typedef {import("./ExtendedStructures/ExtendedUser")} ExtendedUser
 * @typedef {import("eris").Message} Message
 * @typedef {import("../main.js").Client} Client
 * @typedef {import("./ExtendedStructures/ExtendedGuildEntry.js") & import("./References").GuildEntry} GuildEntry
 * @typedef {import("./ExtendedStructures/ExtendedUserEntry") & import("./References").UserEntry} UserEntry
 * @typedef {import("./Contexts/BaseContext")} BaseContext
 * @typedef {import("eris").TextChannel} TextChannel
 */

/** @typedef {Object} CommandHelp
  * @prop {string} [category] DEPRECATED. The category of the command
  * @prop {String} name The name of the command 
  * @prop {String} description The description of the command
  * @prop {String} usage A quick example of how to use the command, every instance of {prefix} will be replaced by the actual prefix in the help command 
  * @prop {String} [externalDoc] A direct URL to some external documentation
  * @prop {String} [preview] A direct URL to a preview image
  */

/** @typedef {Object} PossibleArgValue
  * @prop {String} name The value, if the arg does not match this, the user will be queried again. You can use `*` to make it match everything
  * @prop {String} [interpretAs] This is especially helpful when the syntax of the command isn't how you would humanly prompt a user, this define what exactly will be pushed in the `args` array, note that `{value}` will be replaced by value. If `false`, it won't be pushed into the `args` array
  */

/** @typedef {Object} ExpectedArg
  * @prop {String} description A string describing what is the expected argument, this will be displayed in the query
  * @prop {Function} [condition] A function that will be called with the client, message and args parameters. If the function resolves to a falsy value, this argument won't be queried
  * @prop {Array<PossibleArgValue>} [possibleValues] An array representing the possible values for this arg, if not specified, anything passes. Otherwise, if the argument doesn't match the specified possible values, the arg will be re-queried
  */

/** @typedef {Object} CommandConf
  * @prop {Boolean} [requireDB=false] Whether the command requires the database or not, if true, the command won't be called when the connection with the database has been lost 
  * @prop {Boolean|String} [disabled=false] Whether the command is temporarily disabled, if true, this should be a string explaining why the command is disabled
  * @prop {Array<String>} [aliases=[]] An array of aliases for this command
  * @prop {Array<String>} [requirePerms=[]] An array of case-sensitive permissions the bot needs to execute the command, if the bot miss one of the specified permissions, the command won't be called (note that sendMessages and embedLinks are already included)
  * @prop {Boolean} [guildOnly=false] Whether the command can only be used in a guild and not in dms
  * @prop {Boolean} [ownerOnly=false] Whether the command can only be used by the owner set in the config
  * @prop {Array<ExpectedArg>} [expectedArgs=[]] An array of arguments the command needs in order to properly execute the action
  * @prop {Number} [cooldownWeight=5] The "weight" of the command, roughly representing how big the output is, to determine how much the command should impact the user's cooldown
  * @prop {Array<string>} [require=[]] An array of API Keys name (must be the same than set in the config) the command needs, if they are missing from the config, the command will be disabled
  * @prop {Boolean} [guildOwnerOnly=false] Whether this command should be restricted to the guild's owner (if true, must be combined with guildOnly)
  * @prop {Boolean} [hidden=false] Whether this command should be hidden from everyone except the admins set in the config
  */

/** @typedef {Object} CommandCategory
  * @prop {String} name The name of the category
  * @prop {String} emote Emotes representing the category to display on the help command
  * @prop {String} [conf={}] A conf object that will override the default conf, but still get overwritten by the command conf
  */

/** @typedef {Object} CommandOptions
  * @prop {CommandHelp} help An object detailing the command
  * @prop {CommandConf} conf The configuration of the command
  * @prop {CommandCategory} category An object describing the category; this should be passed by the command's category class and not the command itself
  */

/** @typedef {Object} PartialCommandOptions
  * @prop {CommandHelp} help An object detailing the command
  * @prop {CommandConf} [conf] The configuration of the command
  */

/** @typedef {Object} EmbedField
  * @prop {String} name The name of the field
  * @prop {string} value The value of the field
  * @prop {Boolean} inline whether the field should be inline
  */

/**
 * Provide some utility methods to parse the args of a message, check the required permissions...
 * @class Command
 */

class Command {
    /**
     * Create a new instance of Command
     * @param {Client} [client] - The client instance
     * @param {CommandOptions} [options] - General configuration of the command
     */
    constructor(client, options = {}) {
        this.client = client;
        this.help = options.help;
        this.conf = this.commandsConf(options.category ? options.category.conf : {}, options.conf);
        this.category = options.category;
    }

    /**
     * Check if a message calls for a command
     * As it calls the database to check for a custom prefix, the method is asynchronous and may be awaited
     * @param {Message} message - The message object to parse the command from
     * @param {Client} client - The client instance
     * @returns {Promise<object | undefined>} - The command object, or undefined if the message is not prefixed or the command does not exist
     */
    static parseCommand(message, client) {
        return new Promise(async (resolve, reject) => {
            const args = message.content.split(/\s+/);
            // @ts-ignore
            const guildEntry = message.channel.guild && client.handlers.DatabaseWrapper && client.handlers.DatabaseWrapper.healthy ?
                // @ts-ignore
                await client.handlers.DatabaseWrapper.getGuild(message.channel.guild.id).catch(err => {
                    return reject(err);
                }) :
                false;
            let prefixes = client.prefixes.map(p => p); //Clone client.prefixes to not modify it
            let prefix = args[0];
            let command = args[1];
            if (guildEntry && guildEntry.prefix) {
                if (!guildEntry.spacedPrefix) {
                    const unspacedParsing = this._parseUnspacedCommand(message, client, guildEntry, args);
                    prefix = unspacedParsing.prefix;
                    command = unspacedParsing.command;
                }
                prefixes.push(guildEntry.prefix);
                prefixes = prefixes.filter(p => (guildEntry.spacedPrefix && p !== client.config.prefix) || !guildEntry.spacedPrefix);
            }
            if (!prefixes.find(p => p === prefix)) {
                return resolve(undefined);
            } else if (!command) {
                return resolve(undefined);
            }
            return resolve(client.commands.get(command.toLowerCase()) || client.commands.get(client.aliases.get(command.toLowerCase())));
        });
    }

    /**
     *
     *
     * @param {Message} message message
     * @param {Client} client client
     * @param {GuildEntry} guildEntry guildEntry
     * @param {Array<String>} args args
     * @returns {{prefix: String, command: String}} unspaced command
     * @memberof Command
     */
    static _parseUnspacedCommand(message, client, guildEntry, args) {
        const mentionTest = message.content.startsWith(`<@${client.bot.user.id}>`) || message.content.startsWith(`<@!${client.bot.user.id}`);
        const supposedCommand = !mentionTest
            ? args.shift().slice(guildEntry.getPrefix.length).toLowerCase()
            : (args[1] ? args[1].toLowerCase() : false);
        const prefix = !mentionTest ? message.content.substr(0, guildEntry.getPrefix.length) : args[0];
        return {
            prefix,
            command: supposedCommand
        };
    }

    /**
     * Check if the bot has the given permissions to work properly
     * This is a deep check and the channels wide permissions will be checked too
     * @param {Message} message - The message that triggered the command
     * @param {Client} client  - The client instance
     * @param {array} permissions - An array of permissions to check for
     * @param {object} [channel=message.channel] - Optional, a specific channel to check perms for (to check if the bot can connect to a VC for example)
     * @returns {Boolean | Array<String>} - An array of permissions the bot miss, or true if the bot has all the permissions needed, sendMessages permission is also returned if missing
     */
    static clientHasPermissions(message, client, permissions, channel = message.channel) {
        return client.utils.helpers.hasPermissions(message, client.bot.user, permissions, channel);
    }

    /**
     * Check if the bot has the given permissions to work properly
     * This is a deep check and the channels wide permissions will be checked too
     * @deprecated
     * @param {Message} message - The message that triggered the command
     * @param {Client} client  - The client instance
     * @param {array} permissions - An array of permissions to check for
     * @param {object} [channel=message.channel] - Optional, a specific channel to check perms for (to check if the bot can connect to a VC for example)
     * @returns {Boolean | Array<String>} - An array of permissions the bot miss, or true if the bot has all the permissions needed, sendMessages permission is also returned if missing
     */
    clientHasPermissions(message, client, permissions, channel = message.channel) {
        return client.utils.helpers.hasPermissions(message, client.bot.user, permissions, channel);
    }

    /**
     * Query to the user the arguments that they forgot to specify
     * @param {Client} client - The client instance
     * @param {Message} message - The message that triggered the command
     * @param {*} command - The command that the user is trying to run
     * @returns {Promise<Array | Boolean>} An array of arguments
     */
    static async queryMissingArgs(client, message, command) {
        /** @type {Array} */
        let args = [];

        const queryArg = async (arg, ongoingQuery) => {
            const queryMsg = ongoingQuery || await message.channel.createMessage('Note that you can cancel this query anytime by replying `cancel`\n\n' + arg.description);
            const response = await client.handlers.MessageCollector.awaitMessage(message.channel.id, message.author.id);
            if (!response || response.content.toLowerCase() === "cancel") {
                queryMsg.delete().catch(() => { });
                return false;
            }
            if ((arg.possibleValues && !arg.possibleValues.find(value => value.name === "*" || value.name.toLowerCase() === response.content.toLowerCase())) || (arg.validate && !arg.validate(client, message, response.content))) {
                message.channel.createMessage(':x: This is not a valid answer, please reply again with a valid answer')
                    .then(m => {
                        setTimeout(() => {
                            m.delete().catch(() => { });
                        }, 5000);
                    });
                const reQuery = await queryArg(arg, queryMsg);
                return reQuery;
            } else {
                queryMsg.delete().catch(() => { });
                const value = arg.possibleValues ? arg.possibleValues.find(value => value.name.toLowerCase() === response.content.toLowerCase() || value.name === '*') : false;
                return value ? (value.interpretAs === false ? undefined : (value.interpretAs ? value.interpretAs.replace(/{value}/gim, response.content.toLowerCase()) : response.content.toLowerCase())) : response.content;
            }
        };

        for (const element of command.conf.expectedArgs) {
            const condition = element.condition ? await element.condition(client, message, args) : undefined;
            if (condition || typeof condition === 'undefined') {
                const query = await queryArg(element)
                    .catch(err => {
                        client.bot.emit('error', err, message);
                        return false;
                    });
                if (query === false) {
                    message.channel.createMessage(':x: Command aborted').catch(() => { });
                    return false;
                }
                if (query !== undefined) {
                    args.push(query);
                }
            }
        }

        return args;
    }

    /**
     * Resolve a user from a user resolvable and returns an extended user
     * Note that if the user is not found, only username, discriminator and tag are guaranteed (set to unknown) 
     * @param {Client} client - The client instance
     * @param {User | String | Number} userResolvable - A user resolvable, can be an ID, a username#discriminator pattern or a user object
     * @returns {ExtendedUser} returns an extended user object
     */
    resolveUser(client, userResolvable) {
        const defaultUser = { username: 'Unknown', discriminator: 'Unknown' };
        // @ts-ignore
        if (!isNaN(userResolvable)) {
            const user = client.bot.users.get(userResolvable);
            return new client.structures.ExtendedUser(user ? user : defaultUser, this.client);
        } else if (typeof userResolvable === 'string') {
            const spliced = userResolvable.split('#');
            const user = client.bot.users.find(u => u.username === spliced[0] && u.discriminator === spliced[1]);
            return new client.structures.ExtendedUser(user ? user : defaultUser, this.client);
        } else if (typeof userResolvable === 'object') {
            return new client.structures.ExtendedUser(userResolvable, this.client);
        }
    }

    /**
     * Get the highest role of the specified member and returns it
     * @param {Member|string} member - The member object or their ID
     * @param {Guild} guild - The guild object
     * @returns {Object} The highest role of the user
     */
    getHighestRole(member, guild) {
        // @ts-ignore
        member = member.id ? member : guild.members.get(member);
        // @ts-ignore
        const filteredRoles = guild.roles.filter(r => member.roles.includes(r.id));
        return filteredRoles.sort((a, b) => b.position - a.position)[0];
    }

    /**
     * Get a HEX code from decimals
     * @param {number} decimal - The decimal(s) to convert to a HEX representation
     * @returns {string} The HEX code, without the leading hashtag
     */
    getHexColor(decimal) {
        let col = decimal.toString(16);
        //If the decimal is 0
        while (col.length < 6) {
            col = `0${col}`;
        }
        return col;
    }

    commandsConf(categoryConf = {}, commandConf = {}) {
        return Object.assign({
            requireDB: false,
            disabled: false,
            aliases: [],
            requirePerms: [],
            guildOnly: false,
            ownerOnly: false,
            expectedArgs: [],
            cooldownWeight: 5,
            require: [],
            guildOwnerOnly: false,
            hidden: false
        }, categoryConf, commandConf);
    }

    /**
     * 
     * @param {Client|GuildEntry} client - The client instance, or the guild entry if the client instance has been given in the constructor
     * @param {GuildEntry} guildEntry - The guild's database entry, if given as first argument, this is not needed
     * @returns {String} The prefix
     */
    getPrefix(client, guildEntry) {
        client = client.bot ? client : this.client;
        guildEntry = guildEntry || client;
        return guildEntry && guildEntry.prefix ? (guildEntry.prefix + (guildEntry.spacedPrefix ? ' ' : '')) : `${client.config.prefix} `;
    }

    /**
     * 
     * @param {Client} client - The client instance
     * @param {Message} message - The message
     * @param {Array<String>} args - An array of parsed arguments
     * @param {GuildEntry} guildEntry - The guild's database entry
     * @param {UserEntry} userEntry - The user's database entry
     * @returns {Promise<Object>} The generic initial check's return value
     */
    static async initialCheck(client, message, args, guildEntry, userEntry) {
        if (this.options.noArgs && !args[0]) {
            return message.channel.createMessage(this.options.noArgs);
        }
        return { 
            passed: true,
            context: new(require(`./Contexts/${this.category.name}Context`))(client, message, args, guildEntry, userEntry)
        };
    }

    /**
     * Returns a blank embed field
     * @returns {EmbedField} The blank field
     */
    get blankField() {
        return {
            name: '\u200B',
            value: '\u200B',
            inline: true
        };
    }
}

module.exports = Command;