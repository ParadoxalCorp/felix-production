/** @typedef {import("../../main.js").Client} Client 
 * @typedef {import("eris").Message} Message
 * @typedef {import("../References.js").GuildEntry & import("../ExtendedStructures/ExtendedGuildEntry.js")} GuildEntry
 * @typedef {import("../References.js").UserEntry & import("../ExtendedStructures/ExtendedUserEntry.js")} UserEntry
 * @typedef {import("../HandlersStructures/MusicConnection.js")} MusicConnection
 * @typedef {import("../HandlersStructures/MusicConnection.js").FelixTrack} FelixTrack
 * @typedef {import("eris").VoiceChannel} VoiceChannel
*/

const BaseContext = require('./BaseContext');

class MusicContext extends BaseContext {
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
        /** @type {MusicConnection} The MusicConnection instance for this guild, if any */
        this.connection = client.handlers.MusicManager.connections.get(message.channel.guild.id);
        /** @type {FelixTrack} The now playing track on this guild, if any */
        this.currentTrack = this.connection ? this.connection.nowPlaying : null;
        /** @type {VoiceChannel} The voice channel the bot is in, if any */
        this.clientVC = message.channel.guild.channels.get(message.channel.guild.members.get(this.client.bot.user.id).voiceState.channelID);
        /** @type {VoiceChannel} The voice channel the user is in, if any */
        this.userVC = message.channel.guild.channels.get(message.channel.guild.members.get(message.author.id).voiceState.channelID);
    }    
}

module.exports = MusicContext;

