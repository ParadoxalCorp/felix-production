/** @typedef {import("../../main.js").Client} Client 
 * @typedef {import("../ExtendedStructures/ExtendedMessage").ExtendedMessage} ExtendedMessage
 * @typedef {import("../ExtendedStructures/ExtendedUser")} ExtendedUser
 * @typedef {import("eris").User} User
 * @typedef {import("../References.js").GuildEntry & import("../ExtendedStructures/ExtendedGuildEntry.js")} GuildEntry
 * @typedef {import("../References.js").UserEntry & import("../ExtendedStructures/ExtendedUserEntry.js")} UserEntry
 * @typedef {import("eris").Member} Member
 * @typedef {import("eris").Guild} Guild
 * @typedef {import("eris").TextChannel} TextChannel
 * @typedef {import("eris").VoiceChannel} VoiceChannel
 */

/** @typedef {Object} UserHasPermissions 
  * @prop {Array<String>|Boolean} missingPerms An array of permissions the user miss, or `false` if the user has all the given permissions 
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
                custom: '<:loading:480681099115102208>',
                default: ':ping_pong:'
            },
            picture: {
                custom: '<:picture:481113522416386048>',
                default: ':frame_photo:'
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

    
}

module.exports = BaseContext;
