'use strict';

/**   
* @typedef {import("../../../main.js")} Client
* @typedef {import("./musicConnection").FelixTrack} FelixTrack
*/

/**
* @typedef {Object} MusicContext 
* @property {import("eris").Message} message The message 
* @property {Array<string>} args The parsed args 
* @property {import("../data/references.js").GuildEntry & import("./extendedGuildEntry.js")} guildEntry The database entry of the guild, undefined if used in DM
* @property {import("../data/references.js").UserEntry & import("./extendedUserEntry.js")} userEntry The database entry of the user
* @property {import("./musicConnection.js")} connection The MusicConnection instance of the guild, if any
* @property {import("./musicConnection.js").FelixTrack} currentTrack The currently playing track, if any
* @property {import("eris").VoiceChannel} clientVC The voice channel the bot is in, if any
* @property {import("eris").VoiceChannel} userVC The voice channel the user is in, if any
*/

const Command = require('./Command');

class MusicCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {{noArgs: string, userInVC: boolean, autoJoin: boolean, playing: boolean}} [options={}]  - `noArgs` specify a message to return if no arguments are provided, `userInVC` checks if the member is in a voice channel, `autoJoin` automatically joins the voice channel if not in, `playing` checks if Felix is playing. These args will make the command handler act before running the command
     */
    constructor(client, options = {}) {
        super(client);
        this.options = options;
        this.category = {
            name: 'Music',
            emote: ':musical_note: :new:'
        };
        this.genericConf = this.commandsConf.bind(null, {
            guildOnly: true,
            requirePerms: ['voiceConnect', 'voiceSpeak']
        });
    }

    //eslint-disable-next-line no-unused-vars
    async initialCheck(message, args, guildEntry, userEntry) {
        const member = message.channel.guild.members.get(message.author.id);
        const clientMember = message.channel.guild.members.get(this.client.bot.user.id);
        if (this.options.noArgs && !args[0]) {
            return message.channel.createMessage(this.options.noArgs);
        } else if (this.options.userInVC && (clientMember.voiceState.channelID && clientMember.voiceState.channelID !== member.voiceState.channelID)) {
            return message.channel.createMessage(':x: You must be connected in a voice channel with me to use that');
        } 
        const userVC = message.channel.guild.channels.get(member.voiceState.channelID);
        if (this.options.autoJoin && !clientMember.voiceState.channelID) {
            if (Array.isArray(this.clientHasPermissions(message, this.client, ['voiceConnect', 'voiceSpeak'], message.channel.guild.channels.get(member.voiceState.channelID)))) {
                return message.channel.createMessage(':x: It seems like I lack the permission to connect or to speak in the voice channel you are in :c');
            }
            if (userVC) {
                await this.client.musicManager.getPlayer(userVC);
            }
        }
        const connection = this.client.musicManager.connections.get(message.channel.guild.id);
        if (this.options.playing) {
            if (!connection || !connection.nowPlaying) {
                return message.channel.createMessage(':x: I am not playing anything');
            }
        }
        return { 
            passed: true,
            context: { message, args, guildEntry, userEntry, connection, 
                currentTrack: connection ? connection.nowPlaying : null, 
                clientVC: message.channel.guild.channels.get(message.channel.guild.members.get(this.client.bot.user.id).voiceState.channelID), userVC
            }
        };
    }

    /**
     * 
     * @param {Number} position - The position
     * @param {Array<FelixTrack>} queue - The queue
     * @returns {Boolean} Whether the given position is a valid track position
     */
    isValidPosition(position, queue) {
        return !position || !this.client.isWholeNumber(position) || (position - 1 >= queue.length) || (position - 1 < 0) ? false : true;
    }

    async genericEmbed(track, connection, title, newTrack = false) {
        let fields = [{
            name: 'Author',
            value: track.info.author,
            inline: true
        }, {
            name: 'Duration',
            value: (connection.nowPlaying.track === track.track ? `${this.client.musicManager.parseDuration(newTrack ? 0 : connection.player.state.position || 0)}/` : '') + this.client.musicManager.parseDuration(track),
            inline: true
        }];
        if (track.info.requestedBy) {
            let user = await this.client.fetchUser(track.info.requestedBy);
            // @ts-ignore
            fields.push({
                name: 'Requested by',
                value: user.tag
            });
        }
        return {
            title: `:musical_note: ${title}`,
            description: `[${track.info.title}](${track.info.uri})`,
            fields: fields,
            color: this.client.config.options.embedColor
        };
    }

    /**
     * 
     * @param {MusicContext} context - The context
     * @param {Array<FelixTrack>} tracks - An array of tracks to create a selection menu from
     * @returns {Promise<FelixTrack | Boolean>} The selected track
     */

    async selectTrack(context, tracks) {
        tracks = tracks.splice(0, 15);
        let searchResults = `Your search has returned multiple results, please select one by replying their corresponding number\n\n`;
        let i = 1;
        for (const song of tracks) {
            searchResults += `\`${i++}\` - **${song.info.title}** by **${song.info.author}** (${this.client.musicManager.parseDuration(song)})\n`;
        }
        await context.message.channel.createMessage(searchResults);
        const reply = await this.client.messageCollector.awaitMessage(context.message.channel.id, context.message.author.id);
        if (!reply) {
            context.message.channel.createMessage(':x: Timeout, command aborted').catch(() => {});
            return false;
        } else if (!this.client.isWholeNumber(reply.content)) {
            context.message.channel.createMessage(':x: You must reply with a whole number').catch(() => {});
            return false;
        }
        if (reply.content >= tracks.length) {
            return tracks[tracks.length - 1];
        } else if (reply.content <= 1) {
            return tracks[0];
        } else {
            return tracks[reply.content - 1];
        }
    }
}

module.exports = MusicCommands;