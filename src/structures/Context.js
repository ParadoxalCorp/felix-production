// @ts-nocheck
/** 
 * @typedef {import('eris').Message} Message
 * @typedef {import('../Cluster')} Client
 * @typedef {import('eris').Guild} Guild
 * @typedef {import('eris').Member} Member
 * @typedef {import('./GuildEntry')} GuildEntry
 * @typedef {import('./UserEntry')} UserEntry
 * @typedef {import('i18next').default.TOptions} TOptions
 * @typedef {import('eris').Shard} Shard
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
     * @returns
     */
    sendLocale(key, options = {}) {
        return this.msg.channel.createMessage(this.client.i18n(key, { lng: this.userEntry.props.lang || this.guildEntry.props.lang || 'en-US', ...options}));
    }

    /**
     * Return the given translation string in the appropriate language
     * @param {String} key The key of the translation string
     * @param {TOptions} [options={}] The options to pass along
     * @returns
     */
    returnLocale(key, options = {}) {
        return this.client.i18n(key, { lng: this.userEntry.props.lang || this.guildEntry.props.lang || 'en-US', ...options});
    }
}