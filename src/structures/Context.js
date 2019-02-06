// @ts-nocheck
/** 
 * @typedef {import('eris').Message} Message
 * @typedef {import('../Cluster')} Client
 * @typedef {import('eris').Guild} Guild
 * @typedef {import('eris').Member} Member
 * @typedef {import('./GuildEntry')} GuildEntry
 * @typedef {import('./UserEntry')} UserEntry
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
    }
}