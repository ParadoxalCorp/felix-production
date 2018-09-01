/** @typedef {import("../../main.js").Client} Client 
 * @typedef {import("../ExtendedStructures/ExtendedMessage").ExtendedMessage} ExtendedMessage
 * @typedef {import("../ExtendedStructures/ExtendedUser")} ExtendedUser
 * @typedef {import("eris").User} User
 * @typedef {import("../References.js").GuildEntry & import("../ExtendedStructures/ExtendedGuildEntry.js")} GuildEntry
 * @typedef {import("../References.js").UserEntry & import("../ExtendedStructures/ExtendedUserEntry.js")} UserEntry
 * @typedef {import("eris").Member} Member
 * @typedef {import("eris").Guild} Guild
 * @typedef {import("eris").Message} Message
 * @typedef {import("eris").TextChannel} TextChannel
 * @typedef {import("eris").VoiceChannel} VoiceChannel
 * @typedef {import("eris").Message} Message 
 * @typedef {import("../../handlers/ExperienceHandler").LevelDetails} LevelDetails
 * @typedef {import("eris").Role} Role 
 * @typedef {import("eris").CategoryChannel} CategoryChannel
 */

/** @typedef {Object} UserHasPermissions 
  * @prop {Array<String>|Boolean} missingPerms An array of permissions the user miss, or `false` if the user has all the given permissions 
  */

/** @typedef {Object} Target 
 * @prop {UserEntry} [userEntry] The target's database entry, if any/the database is available
 * @prop {LevelDetails} [globalLevelDetails] The target's global level details, if any
 * @prop {LevelDetails} [localLevelDetails] The target's local level details, if any
 * @prop {Member} [member] The target's member object, if the message was sent in a guild
 * @prop {User|ExtendedUser} user The target's user object, this may be a normal `User` instance if one was given in `Context.setTarget()`
 * @prop {Number} [localExperience] The target's experience on this guild, if the message was sent in a guild
*/

/** @typedef {Object} ExactMatchResolverOptions 
 * @prop {String} text The text to resolve something from
 * @prop {String} type The type of the thing to resolve, can be either `roles`, `members`, or `channels`
 * @prop {Number} [channelType] If a channel, an optional channel type to restrict the search to
*/

class BaseContext {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {Message} message - The message
     * @param {Array<String>} args - The parsed args
     * @param {GuildEntry} guildEntry - The guild database entry, if any
     * @param {UserEntry} userEntry - The user database entry
     */
    constructor(client, message, args, guildEntry, userEntry) {
        /** @type {Client} The client instance */
        this.client = client;
        /** @type {ExtendedMessage} The message that invoked this command */
        this.message = new client.structures.ExtendedMessage(message, client);
        /** @type {Array<String>} The parsed arguments given in the message */
        this.args = args;
        /** @type {GuildEntry} The guild's database entry, if any */
        this.guildEntry = guildEntry;
        /** @type {UserEntry} The user's database entry */
        this.userEntry = userEntry;
        /** @type {Guild} If the message was sent in a guild, the guild object, otherwise undefined */
        this.guild = message.channel.guild;
        /** @type {String} The prefix for this guild if any, or the default prefix */
        this.prefix = guildEntry && guildEntry.prefix ? (guildEntry.prefix + (guildEntry.spacedPrefix ? ' ' : '')) : `${client.config.prefix} `;
        /** @type {Member} If the message was sent in a guild, the member object of the author, otherwise undefined */
        this.member = message.channel.guild ? message.channel.guild.members.get(message.author.id) : undefined;
        /** @type {Member} If the message was sent in a guild, the member object of the bot, otherwise undefined */
        this.clientMember = message.channel.guild ? message.channel.guild.members.get(client.bot.user.id) : undefined;
        /** @type {LevelDetails} The global level details of the user, if any */
        this.globalLevelDetails = this.userEntry ? client.handlers.ExperienceHandler.getLevelDetails(userEntry.getLevel()) : undefined;
        /** @type {LevelDetails} The local level details of the user for this guild, if any */
        this.localLevelDetails = this.guildEntry ? client.handlers.ExperienceHandler.getLevelDetails(guildEntry.getLevelOf(message.author.id)) : undefined;
        /** @type {Target} This will be a `Target` instance if `Context.setTarget()` has been called, otherwise undefined */
        this.target = undefined;
        this._emotes = {
            online: {
                custom: '<:online:480178991467200524>',
                default: ':white_check_mark:' 
            },
            offline: {
                custom: '<:offline:480178982579470336>',
                default: ':x:'
            },
            ping: {
                custom: '<a:loading:480681099115102208>',
                default: ':ping_pong:'
            },
            picture: {
                custom: '<:picture:481113522416386048>',
                default: ':frame_photo:'
            },
            hammerPick: {
                custom: ':hammer_pick:',
                default: ':hammer_pick:'
            },
            gear: {
                custom: ':gear:',
                default: ':gear:'
            },
            musicalNote: {
                custom: ':musical_note:',
                default: ':musical_note:'                
            },
            new: {
                custom: ':new:',
                default: ':new:'                
            },
            tools: {
                custom: ':tools:',
                default: ':tools:'                
            },
            moneybag: {
                custom: ':moneybag:',
                default: ':moneybag:'                
            },
            tada: {
                custom: ':tada:',
                default: ':tada:'                
            },
            bookmark: {
                custom: ':bookmark:',
                default: ':bookmark:'                
            },
            heart: {
                custom: '<:nekoheart:481418928464199700>',
                default: ':heart:'
            },
            barChart: {
                custom: ':bar_chart:',
                default: ':bar_chart:'
            },
            headphones: {
                custom: ':headphones:',
                default: ':headphones:'
            }                
        };
    }
    
    /**
     * Returns the right emote according to the bot's permission to use external emotes, to make sure an emote is always displayed
     * @param {String} emote - The emote's name to use
     * @returns {String} The emote according to the bot's permissions
     */
    emote(emote) {
        if (!this._emotes[emote]) {
            return undefined;
        }
        return (!this.guild || !this.hasPermissions(['externalEmojis'], this.client.bot.user).missingPerms) ? this._emotes[emote].custom : this._emotes[emote].default;
    }

    /**
     * 
     * @param {Array<String>} permissions - An array of permissions to check if 
     * @param {Member | User | ExtendedUser} [target=this.message.author]  - The user from whose permissions should be checked
     * @param {VoiceChannel | TextChannel} [channel=this.message.channel] - Optional, a specific channel to check perms for (to check if the bot can connect to a VC for example), defaults to the message's channel
     * @returns {UserHasPermissions} The user's missing permissions, if any
     */
    hasPermissions(permissions, target = this.message.author, channel = this.message.channel) {
        const result = this.client.utils.helpers.hasPermissions(this.message, target, permissions, channel);
        return {
            missingPerms: Array.isArray(result) ? result : false
        };
    }

    /**
     * Get the member object of the given user for this guild
     * @param {String|User|ExtendedUser} user - The user to get the member object for
     * @returns {Member} The member object for this user
     */
    getMember(user) {
        if (typeof user === 'string') {
            return this.guild.members.get(user);
        } else {
            return this.guild.members.get(user.id);
        }
    }

    /**
     * Set a specific target for this context, this will make `Context.target` a `Target` instance
     * @param {User|ExtendedUser} user - The target user
     * @returns {Target} The target's data
     */
    async setTarget(user) {
        const userEntry = user.id === this.message.author.id 
            ? this.userEntry 
            : (this.client.handlers.DatabaseWrapper.healthy 
                ? await this.client.handlers.DatabaseWrapper.getUser(user.id) 
                : undefined);
        this.target = {
            userEntry,
            member: this.guild ? this.getMember(user.id) : undefined,
            globalLevelDetails: userEntry ? this.client.handlers.ExperienceHandler.getLevelDetails(userEntry.getLevel()) : undefined,
            localLevelDetails: this.guildEntry ? this.client.handlers.ExperienceHandler.getLevelDetails(this.guildEntry.getLevelOf(user.id)) : undefined,
            user,
            localExperience: this.guildEntry && this.guildEntry.experience.members.find(u => u.id === user.id) ? this.guildEntry.experience.members.find(u => u.id === user.id).experience : 0
        };
        return this.target;
    }

    /**
     * 
     * @param {String} [text] - The  text to resolve a user from, defaults to `<Context>.args[0]` or `<Context>.message.content` if `args` is empty
     * @returns {Promise<ExtendedUser>} The resolved user, or null if none is found
     */
    async getUserFromText(text = (this.args[0] || this.message.content)) {
        const exactMatch = await this._resolveByExactMatch({text, type: 'members'});
        if (exactMatch) {
            return new this.client.structures.ExtendedUser(exactMatch, this.client);
        }
        //While it is unlikely, resolve the user by ID if possible
        // @ts-ignore
        text = text.replace(/<@!/g, '').replace(/<@/g, '').replace(/>/g, '');
        if (this.guild.members.get(text)) {
            // @ts-ignore
            return new this.client.structures.ExtendedUser(this.guild.members.get(text).user, this.client || this.client);
        }
        const user = this.client.bot.users.get(text);
        return user ? new this.client.structures.ExtendedUser(user, this.client || this.client) : null;
    }

    /**
     * 
     * @param {String} [text] - The text to resolve a role from, defaults to `<Context>.args[0]` or `<Context>.message.content` if `args` is empty
     * @returns {Promise<Role>} The resolved role, or null if none is found
     */
    async getRoleFromText(text = (this.args[0] || this.message.content)) {
        const exactMatch = await this._resolveByExactMatch({text, type: 'roles'});
        if (exactMatch) {
            return exactMatch;
        }
        //While it is very unlikely, resolve the role by ID/mention if possible
        // @ts-ignore
        text = text.replace(/<|>|\@|\&/g, '');
        if (this.guild.roles.get(text)) {
            // @ts-ignore
            return this.guild.roles.get(text);
        }
        return null;
    }

    /**
     * 
     * @param {String} [text] - The text to resolve a channel from, defaults to `<Context>.args[0]` or `<Context>.message.content` if `args` is empty
     * @param {String|Number} [type] - The type of the channel to resolve, can be either `category`, `text`, `voice` or the raw type numbers as specified in Discord's API. Defaults to `text`
     * @returns {Promise<CategoryChannel|TextChannel|VoiceChannel>} The resolved channel, or null if none is found
     */
    async getChannelFromText(text = (this.args[0] || this.message.content), type = 0) {
        const channelTypes = {
            category: 4,
            text: 0,
            voice: 2
        };
        type = typeof type === 'number' ? type : channelTypes[type];
        // @ts-ignore
        const exactMatch = await this._resolveByExactMatch({text, type: 'channels', channelType: type});
        if (exactMatch) {
            return exactMatch;
        }

        //While it is very unlikely, resolve the channel by ID (and mention) if possible
        text = text.replace(/<|>|#/g, '');
        // @ts-ignore
        const channelByID = this.guild.channels.get(text);
        if (channelByID && channelByID.type === type) {
            return channelByID;
        }

        return null;
    }

    /**
     * Resolve something by exact match
     * @param {ExactMatchResolverOptions} options - The options for the resolver
     * @returns {Promise<Role|User|TextChannel|CategoryChannel|VoiceChannel>} The resolved role/user/channel
     */
    async _resolveByExactMatch(options) {
        // @ts-ignore
        const exactNameMatch = (name) => (name).toLowerCase().split(/\s+/).join(" ") === options.text.toLowerCase().split(/\s+/).join(" ");
        const exactMatches = this.guild[options.type]
            .filter(v => exactNameMatch(v.name || v.username) || exactNameMatch(v.nick || ''))
            .filter(v => options.channelType ? v.type === options.channelType : true);
        const dataToShow = (value) => {
            let data = value.name || `${value.username}#${value.discriminator}`;
            //Roles
            if (typeof value.hoisted !== 'undefined') {
                data += `(Position: ${value.position} ; Hoisted: ${value.hoist ? "Yes" : "No"})`;
            } 
            //Voice channels/Text channels
            else if (typeof value.topic !== 'undefined' || typeof value.bitrate !== 'undefined') {
                data += `(Topic: ${value.topic ? value.topic.substr(0, 42) + '...' : 'None'} ; Bitrate: ${value.bitrate ? value.bitrate : "None"})`;
            }
            return data;
        };
        if (exactMatches.length === 1) {
            return exactMatches[0];
        } else if (exactMatches.length > 1) {
            let i = 1;
            await this.message.channel.createMessage({
                embed: {
                    title: `:mag: ${options.type.charAt(0).toUpperCase() + options.type.substr(1)} search`,
                    description:`I found multiple ${options.type} with that name, select one by answering with their corresponding number\`\`\`\n` + exactMatches.map(v => `[${i++}] - ${dataToShow(v)}`).join("\n") + "```",
                    footer: {
                        text: 'Time limit: 60 seconds'
                    },
                    color: this.client.config.options.embedColor.generic
                }
            });
            const reply = await this.client.handlers.MessageCollector.awaitMessage(this.message.channel.id, this.message.author.id, 60000).catch(err => {
                this.client.bot.emit("error", err);
                return null;
            });
            return exactMatches[reply.content - 1] ? exactMatches[reply.content - 1] : null;
        }
    }
}

module.exports = BaseContext;
