
/** 
 * @typedef {import('eris').Message} Message
 * @typedef {import('../Cluster')} Client
 * @typedef {import('eris').Guild} Guild
 * @typedef {import('eris').Member} Member
 * @typedef {import('./GuildEntry')} GuildEntry
 * @typedef {import('./UserEntry')} UserEntry
 * @typedef {import('i18next').default.TOptions} TOptions
 * @typedef {import('eris').Shard} Shard
 * @typedef {import('eris').Role} Role
 * @typedef {import('eris').CategoryChannel} CategoryChannel
 * @typedef {import('eris').TextChannel} TextChannel
 * @typedef {import('eris').User} User
 * @typedef {import('eris').AnyGuildChannel} AnyGuildChannel
 * @typedef {import("eris").AnyChannel} AnyChannel
 * @typedef {import("eris").TextableChannel} TextableChannel
 * @typedef {import("eris").ExtendedUser} ExtendedUser
 * @typedef {import("eris").EmbedOptions} EmbedOptions
 */

module.exports = class Context {
    /**
     * Creates a new context
     * @param {Message} msg The message
     * @param {Client} client The client instance
     * @param {GuildEntry} guildEntry The guild's database entry
     * @param {UserEntry} userEntry The author's database entry
     * @param {Object} args The parsed arguments in a `{ key: value }` structure
     */
    constructor(msg, client, guildEntry, userEntry, args) {
        /** @type {Message} The message */
        this.msg = msg;
        /** @type {Client} The client instance */
        this.client = client;
        /** @type {Guild} The guild in which the message was sent, will be `undefined` in direct messages */
        // @ts-ignore
        this.guild = msg.channel.guild;
        /** @type {Member} The message author as a member, will be `undefined` in direct messages */
        this.member = msg.member;
        /** @type {Member} The bot as a member, will be `undefined` in direct messages */
        this.clientMember = msg.member ? msg.member.guild.members.get(client.user.id) : undefined;
        /** @type {UserEntry} The author's database entry */
        this.userEntry = userEntry;
        /** @type {GuildEntry} The guild's database entry */
        this.guildEntry = guildEntry;
        /** @type {Object} The parsed arguments in a `{ key: value }` structure */
        this.args = args;
        /** @type {Shard} The shard on which this guild is, or the first shard of this cluster */
        this.shard = this.guild ? this.guild.shard : this.client.shards.map(s => s)[0];
    }

    /**
     * Sends a message to the message's channel in the appropriate language
     * @param {String} key The key of the translation string
     * @param {TOptions} [options={}] The options to pass along
     * @returns {Promise<Message>} The message sent
     */
    sendLocale(key, options = {}) {
        return this.msg.channel.createMessage(this.client.i18n(key, { lng: this.userEntry.props.lang || (this.guildEntry ? this.guildEntry.props.lang : false) || "en-US", ...options}));
    }

    /**
     * Return the given translation string in the appropriate language
     * @param {String} key The key of the translation string
     * @param {TOptions} [options={}] The options to pass along
     * @returns {String} The translated string
     */
    returnLocale(key, options = {}) {
        return this.client.i18n(key, { lng: this.userEntry.props.lang || (this.guildEntry ? this.guildEntry.props.lang : false) || "en-US", ...options});
    }

    /**
     * Get a permission's target object
     * @param {String} [targetTypeKey="targetType"] - An optional parameter defining what key is the target type in the `args`, defaults to `targetType`
     * @param {String} [targetKey="target"] - An optional parameter defining what key is the target in the `args`, defaults to `target`
     * @returns {Promise<TextChannel | Role | User | CategoryChannel | string>} The target, or null if none is found
     */
    async getPermissionTarget(targetTypeKey = "targetType", targetKey = "target") {
        const target = this.args[targetTypeKey].toLowerCase() === "global" ? "global" : null;
        const targetType = this.args[targetTypeKey].toLowerCase();
        if (["category", "channel"].includes(targetType)) {
            return await this.fetchChannel(this.args[targetKey], targetType === "channel" ? "text" : "category");
        } else if (targetType === "role") {
            return await this.fetchRole(this.args[targetKey]);
        } else if (targetType === "user") {
            return await this.fetchUser(this.args[targetKey]);
        } else {
            return target;
        }
    }

    /**
     * Checks if a given string is a valid permission permission target
     * @param {String} arg - The string to validate
     * @returns {Boolean} Whether the given string is a valid permission target
     */
    validatePermissionTarget(arg) {
        return arg ? ["global", "category", "channel", "role", "user"].includes(arg.toLowerCase()) : false;
    }

    /**
     * Checks if a given string is a valid permission
     * @param {String} arg - The string on which to perform the check
     * @returns {Boolean} Whether the given string is a valid permission
     */
    validatePermission(arg) {
        let categories = [];
        arg = arg ? arg.toLowerCase() : "";
        //eslint-disable-next-line no-unused-vars
        for (const [key, command] of this.client.commands) {
            if (!categories.includes(command.category) && command.category !== "admin") {
                categories.push(`${command.category.toLowerCase()}*`);
            } 
        }
        let command = this.client.commands.get(arg) || this.client.commands.get(this.client.aliases.get(arg));
        if (command && command.category === "admin") {
            return false;
        }
        return (!command && !categories.includes(arg) && arg !== "*") ? false : true;
    }

    /**
     * Try to resolve a user with IDs, names, partial usernames or mentions
     * @param {string} [text=this.msg.content] - The text from which users should be resolved, if none provided, it will use the message content
     * @returns {Promise<User>} The resolved user, or nothing if none could be resolved
     */
    async fetchUser(text = this.msg.content) {
        const exactMatch = await this._resolveUserByExactMatch(text);
        if (exactMatch) {
            return exactMatch;
        }
        //While it is unlikely, resolve the user by ID if possible
        if (this.guild.members.get(text)) {
            return this.guild.members.get(text).user;
        }

        const mention = new RegExp(/<@|<!@/g);
        if (mention.test(text)) {
            const id = text.replace(/<@!/g, "").replace(/<@/g, "").replace(/>/g, "");
            const user = this.client.users.get(id);
            return user;
        }
    }

    /**
     * @param {String} text - The text
     * @private
     * @returns {Promise<User | false>} The user, or false if none found
     */
    async _resolveUserByExactMatch(text) {
        //Filter the members with a username or nickname that match exactly the text
        // @ts-ignore
        const exactMatches = this.msg.channel.guild.members.filter(m =>
            m.username.toLowerCase().split(/\s+/).join(" ") === text.toLowerCase().split(/\s+/).join(" ") ||
            (m.nick && m.nick.toLowerCase().split(/\s+/).join(" ") === text.toLowerCase().split(/\s+/).join(" ")));
        if (exactMatches.length === 1) {
            return exactMatches[0];
        } else if (exactMatches.length > 1) {
            let i = 1;
            await this.msg.channel.createMessage({
                embed: {
                    title: this.returnLocale("generic.search-title", { type: "User" }),
                    description: this.returnLocale("generic.search-description", { type: "users", list: "```\n" + exactMatches.map(m => `[${i++}] - ${m.username}#${m.user.discriminator}`).join("\n") + "```"}),
                    footer: {
                        text: this.returnLocale("generic.promt-time-limit", { seconds: "60" })
                    }
                }
            });
            const reply = await this.client.messageCollector.awaitMessage(this.msg.channel.id, this.msg.author.id, 60000).catch(err => {
                this.client.emit("error", err);
                return false;
            });
            // @ts-ignore
            return exactMatches[reply.content - 1] ? exactMatches[reply.content - 1] : false;
        }
    }

    /**
     * Try to resolve a role with IDs or names
     * @param {string} [text=this.msg.content] - The text from which roles should be resolved, if none provided, it will use the message content
     * @returns {Promise<Role>} The resolved role, or nothing if none could be resolved
     */
    async fetchRole(text = this.msg.content) {
        const exactMatch = await this._resolveRoleByExactMatch(text);
        if (exactMatch) {
            return exactMatch;
        }
        //While it is very unlikely, resolve the role by ID if possible
        // @ts-ignore
        if (this.guild.roles.get(text)) {
            // @ts-ignore
            return this.guild.roles.get(text);
        }
    }

    /**
     * @param {String} text - The text
     * @private
     * @returns {Promise<Role | false>} The role, or false if none found
     */
    async _resolveRoleByExactMatch(text) {
        // @ts-ignore
        const exactMatches = this.guild.roles.filter(r => r.name.toLowerCase().split(/\s+/).join(" ") === text.toLowerCase().split(/\s+/).join(" "));
        if (exactMatches.length === 1) {
            return exactMatches[0];
        } else if (exactMatches.length > 1) {
            let i = 1;
            await this.msg.channel.createMessage({
                embed: {
                    title: this.returnLocale("generic.search-title", { type: "Role" }),
                    description: this.returnLocale("generic.search-description", { type: "roles", list: "```\n" + exactMatches.map(r => `[${i++}] - ${r.name} (Position: ${r.position} ; Hoisted: ${r.hoist ? "Yes" : "No"})`).join("\n") + "```" }),
                    footer: {
                        text: this.returnLocale("generic.promt-time-limit", { seconds: "60" })
                    }
                }
            });
            const reply = await this.client.messageCollector.awaitMessage(this.msg.channel.id, this.msg.author.id, 60000).catch(err => {
                this.client.emit("error", err);
                return false;
            });
            // @ts-ignore
            return exactMatches[reply.content - 1] ? exactMatches[reply.content - 1] : false;
        }
    }

    /**
     * 
     * @param {string} [text=this.msg.content] - The text to resolve a channel from
     * @param {String|Number} [type] - The explicit type of the channel to search for, can be used to search for categories for example (`category`,  `text`, `voice`), defaults to `text`
     * @returns {Promise<AnyGuildChannel>} The channel object, or nothing if none found
     */
    async fetchChannel(text = this.msg.content, type = "text") {
        const channelTypes = {
            category: 4,
            text: 0,
            voice: 2
        };
        if (type) {
            type = !channelTypes[type] && channelTypes[type] !== 0 ? type : channelTypes[type];
        }
        // @ts-ignore
        const exactMatch = await this._resolveChannelByExactMatch(text, type);
        if (exactMatch) {
            return exactMatch;
        }

        //While it is very unlikely, resolve the channel by ID (and mention) if possible
        text = text.replace(/<|>|#/g, "");
        // @ts-ignore
        const channelByID = this.guild.channels.get(text);
        if (channelByID && channelByID.type === type) {
            return channelByID;
        }
    }

    /**
     * @param {string} text - The text
     * @param {boolean} type - Whether the channel is a text channel or a voice channel
     * @private
     * @returns {Promise<AnyGuildChannel | false>} The channel, or false if none found
     */
    async _resolveChannelByExactMatch(text, type) {
        // @ts-ignore
        const exactMatches = this.msg.channel.guild.channels.filter(c => c.name.toLowerCase() === text.toLowerCase() && c.type === type);
        if (exactMatches.length === 1) {
            return exactMatches[0];
        } else if (exactMatches.length > 1) {
            let i = 1;
            await this.msg.channel.createMessage({
                embed: {
                    title: this.returnLocale("generic.search-title", { type: "Channel" }),
                    description: this.returnLocale("generic.search-description", { type: "channels", list: "```\n" + exactMatches.map(c => `[${i++}] - ${c.name} (Topic: ${c.topic ? c.topic.substr(0, 42) + "..." : "None"} ; Bitrate: ${c.bitrate ? c.bitrate : "None"})`).join("\n") + "```" }),
                    footer: {
                        text: this.returnLocale("generic.promt-time-limit", { seconds: "60" })
                    }
                }
            });
            const reply = await this.client.messageCollector.awaitMessage(this.msg.channel.id, this.msg.author.id, 60000).catch(err => {
                this.client.emit("error", err);
                return false;
            });
            // @ts-ignore
            return exactMatches[Number(reply.content) - 1] ? exactMatches[Number(reply.content) - 1] : false;
        }
    }

    /**
     * Check if the message author has all the given permissions
     * @param {Array<String>} perms The permissions to check for
     * @param {AnyChannel} [channel=this.msg.channel] An optional channel to check the permissions for
     * @returns {Boolean} Whether the message author has all permissions
     */
    authorHasPerms(perms, channel = this.msg.channel) {
        return this.client.utils.comparePermissions(this.msg, this.msg.member, perms, channel).allowed;
    }

    /**
     * Check if the client has all the given permissions
     * @param {Array<String>} perms The permissions to check for
     * @param {AnyChannel} [channel=this.msg.channel] An optional channel to check the permissions for
     * @returns {Boolean} Whether the client has all permissions
     */
    clientHasPerms(perms, channel = this.msg.channel) {
        // @ts-ignore
        return this.client.utils.comparePermissions(this.msg, this.client.user, perms, channel).allowed;
    }

        /**
     * Merge the given embed into the bot's generic embed
     * @param {EmbedOptions} embed - The embed to merge onto the generic embed
     * @returns {EmbedOptions} The embed
     */
    genericEmbed(embed) {
        return {
            timestamp: new Date().toISOString(),
            footer: {
                text: this.client.user.username,
                icon_url: this.client.user.avatarURL
            },
            color: Number(process.env.EMBED_COLOR),
            ...embed
        };
    }
    
};