'use strict';

/**
 * @typedef {import("eris").Role} Role 
 * @typedef {import("eris").User} User
 * @typedef {import("eris").Member} Member
 * @typedef {import("eris").Guild} Guild
 * @typedef {import("eris").Channel} Channel
 * @typedef {import("eris").PermissionOverwrite} PermissionOverwrite
 * @typedef {import("./ExtendedStructures/ExtendedUser")} ExtendedUser
 * @typedef {import("eris").Message} Message
 * @typedef {import("../main.js")} Client
 * @typedef {import("./ExtendedStructures/ExtendedGuildEntry.js") & import("./references").GuildEntry} GuildEntry
 */

 /** @typedef {Object} CommandHelp
  * @prop {string} category The category of the command
  * @prop {String} name The name of the command 
  * @prop {String} description The description of the command
  * @prop {String} usage A quick example of how to use the command, every instance of {prefix} will be replaced by the actual prefix in the help command 
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
  * @prop {CommandConf} conf The configuration of the command
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
    parseCommand(message, client) {
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
     * @param {Array} args args
     * @returns {Object} unspaced command
     * @memberof Command
     */
    _parseUnspacedCommand(message, client, guildEntry, args) {
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
     * @returns {boolean | array} - An array of permissions the bot miss, or true if the bot has all the permissions needed, sendMessages permission is also returned if missing
     */
    clientHasPermissions(message, client, permissions, channel = message.channel) {
        const missingPerms = [];
        // @ts-ignore
        const clientMember = message.channel.guild.members.get(client.bot.user.id);

        function hasPerm(perm, Command) {
            if (clientMember.permission.has("administrator")) {
                return true;
            }
            const hasChannelOverwrite = Command.hasChannelOverwrite(channel, clientMember, perm);
            if (!clientMember.permission.has(perm)) {
                if (!hasChannelOverwrite) {
                    return false;
                } else {
                    return hasChannelOverwrite.has(perm) ? true : false;
                }
            } else {
                if (!hasChannelOverwrite) {
                    return true;
                } else {
                    return hasChannelOverwrite.has(perm) ? true : false;
                }
            }
        }

        permissions.forEach(perm => {
            if (!hasPerm(perm, this)) {
                missingPerms.push(perm);
            }
        });
        if (!permissions.includes('sendMessages') && !hasPerm('sendMessages', this)) {
            missingPerms.push('sendMessages');
        }
        return missingPerms[0] ? missingPerms : true;
    }

    /**
     * This method return the effective permission overwrite for a specific permission of a user
     * It takes into account the roles of the member, their position and the member itself to return the overwrite which actually is effective
     * @param {object} channel - The channel to check permissions overwrites in
     * @param {Member} member - The member object to check permissions overwrites for
     * @param {string} permission - The permission to search channel overwrites for
     * @return {boolean | PermissionOverwrite} - The permission overwrite overwriting the specified permission, or false if none exist
     */
    hasChannelOverwrite(channel, member, permission) {
        const channelOverwrites = Array.from(channel.permissionOverwrites.values()).filter(co => typeof co.json[permission] !== "undefined" &&
            (co.id === member.id || member.roles.includes(co.id)));
        if (!channelOverwrites[0]) {
            return false;
        } else if (channelOverwrites.find(co => co.type === "user")) {
            return channelOverwrites.find(co => co.type === "user");
        }
        return channelOverwrites
            //Address issue #45(https://github.com/ParadoxalCorp/felix-production/issues/45)
            .filter(co => channel.guild.roles.has(co.id))
            .sort((a, b) => channel.guild.roles.get(b.id).position - channel.guild.roles.get(a.id).position)[0];
    }

    /**
     * Try to resolve a user with IDs, names, partial usernames or mentions
     * @param {object} options - An object of options
     * @param {Client} options.client - The client instance
     * @param {Message} options.message - The message from which to get the user from
     * @param {string} [options.text=message.content] - The text from which users should be resolved, if none provided, it will use the message content
     * @returns {Promise<User | Boolean>} The resolved user, or false if none could be resolved
     */
    async getUserFromText(options) {
        if (!options.client || !options.message) {
            Promise.reject(new Error(`The options.client and options.message parameters are mandatory`));
        }
        options.text = options.text || options.message.content;
        const exactMatch = await this._resolveUserByExactMatch(options.client, options.message, options.text);
        if (exactMatch) {
            return new options.client.structures.ExtendedUser(exactMatch, this.client);
        }
        //While it is unlikely, resolve the user by ID if possible
        // @ts-ignore
        if (options.message.channel.guild.members.get(options.text)) {
            // @ts-ignore
            return options.client.structures.ExtendedUser(options.message.channel.guild.members.get(options.text), this.client);
        }

        const mention = new RegExp(/<@|<!@/g);
        if (mention.test(options.text)) {
            const id = options.text.replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
            const user = options.client.bot.users.get(id);
            return user ? options.client.structures.ExtendedUser(user) : false;
        }

        return false;
    }

    /**
     * @param {Client} client - The client instance
     * @param {Message} message - The message
     * @param {String} text - The text
     * @private
     * @returns {Promise<User>} The user, or false if none found
     */
    async _resolveUserByExactMatch(client, message, text) {
        //Filter the members with a username or nickname that match exactly the text
        // @ts-ignore
        const exactMatches = message.channel.guild.members.filter(m =>
            m.username.toLowerCase().split(/\s+/).join(" ") === text.toLowerCase().split(/\s+/).join(" ") ||
            (m.nick && m.nick.toLowerCase().split(/\s+/).join(" ") === text.toLowerCase().split(/\s+/).join(" ")));
        if (exactMatches.length === 1) {
            return exactMatches[0];
        } else if (exactMatches.length > 1) {
            let i = 1;
            await message.channel.createMessage({
                embed: {
                    title: ':mag: User search',
                    description: 'I found multiple users with that name, select one by answering with their corresponding number```\n' + exactMatches.map(m => `[${i++}] - ${m.username}#${m.user.discriminator}`).join("\n") + "```",
                    footer: {
                        text: 'Time limit: 60 seconds'
                    }
                }
            });
            const reply = await client.handlers.MessageCollector.awaitMessage(message.channel.id, message.author.id, 60000).catch(err => {
                client.bot.emit("error", err);
                return false;
            });
            return exactMatches[reply.content - 1] ? exactMatches[reply.content - 1] : false;
        }
    }

    /**
     * Try to resolve a role with IDs or names
     * @param {object} options - An object of options
     * @param {Client} options.client - The client instance
     * @param {Message} options.message - The message from which to get the roles from
     * @param {string} [options.text=message.content] - The text from which roles should be resolved, if none provided, it will use the message content
     * @returns {Promise<Role | Boolean>} The resolved role, or false if none could be resolved
     */
    async getRoleFromText(options) {
        if (!options.client || !options.message) {
            Promise.reject(new Error(`The options.client and options.message parameters are mandatory`));
        }
        options.text = options.text || options.message.content;
        const exactMatch = await this._resolveRoleByExactMatch(options.client, options.message, options.text);
        if (exactMatch) {
            return exactMatch;
        }
        //While it is very unlikely, resolve the role by ID if possible
        // @ts-ignore
        if (options.message.channel.guild.roles.get(options.text)) {
            // @ts-ignore
            return options.message.channel.guild.roles.get(options.text);
        }
        return false;
    }

    /**
     * @param {Client} client - The client instance
     * @param {Message} message - The message
     * @param {String} text - The text
     * @private
     * @returns {Promise<Role>} The role, or false if none found
     */
    async _resolveRoleByExactMatch(client, message, text) {
        // @ts-ignore
        const exactMatches = message.channel.guild.roles.filter(r => r.name.toLowerCase().split(/\s+/).join(" ") === text.toLowerCase().split(/\s+/).join(" "));
        if (exactMatches.length === 1) {
            return exactMatches[0];
        } else if (exactMatches.length > 1) {
            let i = 1;
            await message.channel.createMessage({
                embed: {
                    title: ':mag: Role search',
                    description: 'I found multiple roles with that name, select one by answering with their corresponding number```\n' + exactMatches.map(r => `[${i++}] - ${r.name} (Position: ${r.position} ; Hoisted: ${r.hoist ? "Yes" : "No"})`).join("\n") + "```",
                    footer: {
                        text: 'Time limit: 60 seconds'
                    }
                }
            });
            const reply = await client.handlers.MessageCollector.awaitMessage(message.channel.id, message.author.id, 60000).catch(err => {
                client.bot.emit("error", err);
                return false;
            });
            return exactMatches[reply.content - 1] ? exactMatches[reply.content - 1] : false;
        }
    }

    /**
     * 
     * @param {object} options - An object of options
     * @param {Client} options.client - The client instance
     * @param {Message} options.message - The message
     * @param {string} [options.text=message.content] - The text to resolve a channel from
     * @param {Boolean} [options.textual=true] - Whether the channel to resolve is a text channel or a voice channel
     * @param {String|Number} [options.type] - The explicit type of the channel to search for, can be used to search for categories for example ('category', 'text', 'voice')
     * @returns {Promise<object|boolean>} The channel object, or false if none found
     */
    async getChannelFromText(options) {
        const channelTypes = {
            category: 4,
            text: 0,
            voice: 2
        };
        let type = typeof options.textual !== 'undefined' ? (options.textual ? 0 : 2) : 0;
        if (options.type) {
            type = !channelTypes[options.type] && channelTypes[options.type] !== 0 ? options.type : channelTypes[options.type];
        }
        let text = options.text || options.message.content;
        // @ts-ignore
        const exactMatch = await this._resolveChannelByExactMatch(options.client, options.message, text, type);
        if (exactMatch) {
            return exactMatch;
        }

        //While it is very unlikely, resolve the channel by ID (and mention) if possible
        text = text.replace(/<|>|#/g, '');
        // @ts-ignore
        const channelByID = options.message.channel.guild.channels.get(text);
        if (channelByID && channelByID.type === type) {
            return channelByID;
        }

        return false;
    }

    /**
     * @param {Client} client - The client instance
     * @param {Message} message - The message
     * @param {string} text - The text
     * @param {boolean} type - Whether the channel is a text channel or a voice channel
     * @private
     * @returns {Promise<Channel>} The channel, or false if none found
     */
    async _resolveChannelByExactMatch(client, message, text, type) {
        // @ts-ignore
        const exactMatches = message.channel.guild.channels.filter(c => c.name.toLowerCase() === text.toLowerCase() && c.type === type);
        if (exactMatches.length === 1) {
            return exactMatches[0];
        } else if (exactMatches.length > 1) {
            let i = 1;
            await message.channel.createMessage({
                embed: {
                    title: ':mag: Channel search',
                    description: 'I found multiple channels with that name, select one by answering with their corresponding number```\n' + exactMatches.map(c => `[${i++}] - ${c.name} (Topic: ${c.topic ? c.topic.substr(0, 42) + '...' : 'None'} ; Bitrate: ${c.bitrate ? c.bitrate : "None"})`).join("\n") + "```",
                    footer: {
                        text: 'Time limit: 60 seconds'
                    }
                }
            });
            const reply = await client.handlers.MessageCollector.awaitMessage(message.channel.id, message.author.id, 60000).catch(err => {
                client.bot.emit("error", err);
                return false;
            });
            return exactMatches[reply.content - 1] ? exactMatches[reply.content - 1] : false;
        }
    }

    /**
     * Query to the user the arguments that they forgot to specify
     * @param {Client} client - The client instance
     * @param {Message} message - The message that triggered the command
     * @param {*} command - The command that the user is trying to run
     * @returns {Promise<Array | Boolean>} An array of arguments
     */
    async queryMissingArgs(client, message, command) {
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
            return new client.structures.ExtendedUser(user ? user : defaultUser);
        } else if (typeof userResolvable === 'string') {
            const spliced = userResolvable.split('#');
            const user = client.bot.users.filter(u => u.username === spliced[0] && u.discriminator === spliced[1]).random();
            return client.structures.ExtendedUser(user ? user : defaultUser);
        } else if (typeof userResolvable === 'object') {
            return client.structures.ExtendedUser(userResolvable);
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
            guildOwnerOnly: false
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
}

module.exports = Command;