/** @typedef {import("../../main").Client} Client 
 * @typedef {import("eris").Message} Message
 * @typedef {import("../References").GuildEntry & import("../ExtendedStructures/ExtendedGuildEntry")} GuildEntry
 * @typedef {import("../References").UserEntry & import("../ExtendedStructures/ExtendedUserEntry")} UserEntry
*/

const BaseContext = require('./BaseContext');

class SettingsContext extends BaseContext {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {Message} message - The message
     * @param {Array<String>} args - The parsed args
     * @param {GuildEntry} guildEntry - The guild database entry, if any
     * @param {UserEntry} userEntry - The user database entry
     */
    constructor(client, message, args, guildEntry, userEntry) {
        super(client, message, args, guildEntry, userEntry);
    }    
}

module.exports = SettingsContext;

