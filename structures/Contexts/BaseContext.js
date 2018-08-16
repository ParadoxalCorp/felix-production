/** @typedef {import("../../main.js").Client} Client 
 * @typedef {import("eris").Message} Message
 * @typedef {import("../References.js").GuildEntry & import("../ExtendedStructures/ExtendedGuildEntry.js")} GuildEntry
 * @typedef {import("../References.js").UserEntry & import("../ExtendedStructures/ExtendedUserEntry.js")} UserEntry
 * @typedef {import("eris").Member} Member
 * @typedef {import("eris").Guild} Guild
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
        /** @type {Message} The message that invoked this command */
        this.message = message;
        /** @type {Array<String>} The parsed arguments given in the message */
        this.args = args;
        /** @type {GuildEntry} The guild's database entry, if any */
        this.guildEntry = guildEntry;
        /** @type {UserEntry} The user's database entry */
        this.userEntry = userEntry;
        /** @type {Guild}  If the message was sent in a guild, the guild object, otherwise undefined */
        this.guild = message.channel.guild;
        /** @type {Member} If the message was sent in a guild, the member object of the author, otherwise undefined */
        this.member = message.channel.guild ? message.channel.guild.members.get(message.author.id) : undefined;
        /** @type {Member} If the message was sent in a guild, the member object of the bot, otherwise undefined */
        this.clientMember = message.channel.guild ? message.channel.guild.members.get(client.bot.user.id) : undefined;
    }    
}

module.exports = BaseContext;
