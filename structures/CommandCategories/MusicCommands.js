/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../HandlersStructures/musicConnection").FelixTrack} FelixTrack
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
*/

const MusicContext = require('../Contexts/MusicContext.js');

const Command = require('../Command');

class MusicCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string, userInVC: boolean, autoJoin: boolean, playing: boolean}} [options={}]  - `noArgs` specify a message to return if no arguments are provided, `userInVC` checks if the member is in a voice channel, `autoJoin` automatically joins the voice channel if not in, `playing` checks if Felix is playing. These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Music',
            emote: 'musicalNote new',
            conf: {
                guildOnly: true,
                requirePerms: ['voiceConnect', 'voiceSpeak']
            }
        }});
        this.options = options;
    }

    //eslint-disable-next-line no-unused-vars
    async initialCheck(client, message, args, guildEntry, userEntry) {
        if (!(message.channel.guild.id % 5 === 0 || message.channel.guild.id % 3 === 0 || message.channel.guild.id === "235118465071972352" || userEntry.hasPremiumStatus())) {
            return message.channel.createMessage(':x: Ahh i am very sorry but the music feature isn\'t available to everyone yet :v');
        }
        const member = message.channel.guild.members.get(message.author.id);
        const clientMember = message.channel.guild.members.get(this.client.bot.user.id);
        if (this.options.userInVC && (clientMember.voiceState.channelID && clientMember.voiceState.channelID !== member.voiceState.channelID)) {
            return message.channel.createMessage(':x: You must be connected in a voice channel with me to use that');
        } 
        const userVC = message.channel.guild.channels.get(member.voiceState.channelID);
        if (this.options.autoJoin && !clientMember.voiceState.channelID) {
            if (Array.isArray(this.clientHasPermissions(message, this.client, ['voiceConnect', 'voiceSpeak'], message.channel.guild.channels.get(member.voiceState.channelID)))) {
                return message.channel.createMessage(':x: It seems like I lack the permission to connect or to speak in the voice channel you are in :c');
            }
            if (userVC) {
                await this.client.handlers.MusicManager.getPlayer(userVC);
            }
        }
        const connection = this.client.handlers.MusicManager.connections.get(message.channel.guild.id);
        if (this.options.playing) {
            if (!connection || !connection.nowPlaying) {
                return message.channel.createMessage(':x: I am not playing anything');
            }
        }
        if (this.options.noArgs && !args[0]) {
            return message.channel.createMessage(this.options.noArgs);
        }
        return { 
            passed: true,
            context: new MusicContext(client, message, args, guildEntry, userEntry)
        };
    }

    /**
     * 
     * @param {Number} position - The position
     * @param {Array<FelixTrack>} queue - The queue
     * @returns {Boolean} Whether the given position is a valid track position
     */
    isValidPosition(position, queue) {
        return !position || !this.client.utils.isWholeNumber(position) || (position - 1 >= queue.length) || (position - 1 < 0) ? false : true;
    }

    async genericEmbed(track, connection, title) {
        let fields = [{
            name: 'Author',
            value: track.info.author,
            inline: true
        }, {
            name: 'Duration',
            value: (connection.nowPlaying.info._id === track.info._id ? `${this.client.handlers.MusicManager.parseDuration(connection.player.state.position || 0)}/` : '') + this.client.handlers.MusicManager.parseDuration(track),
            inline: true
        }];
        if (track.info.requestedBy) {
            let user = await this.client.utils.helpers.fetchUser(track.info.requestedBy);
            // @ts-ignore
            fields.push({
                name: 'Requested by',
                value: user.tag,
                inline: true
            });
        }
        return {
            title: `:musical_note: ${title}`,
            description: `[${track.info.title}](${track.info.uri})`,
            fields: fields,
            color: this.client.config.options.embedColor.generic,
            thumbnail: {
                url: track.info.requestedBy ? this.client.bot.user.avatarURL : undefined
            }
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
            searchResults += `\`${i++}\` - **${song.info.title}** by **${song.info.author}** (${this.client.handlers.MusicManager.parseDuration(song)})\n`;
        }
        await context.message.channel.createMessage(searchResults);
        const reply = await this.client.handlers.MessageCollector.awaitMessage(context.message.channel.id, context.message.author.id);
        if (!reply) {
            context.message.channel.createMessage(':x: Timeout, command aborted').catch(() => {});
            return false;
        } else if (!this.client.utils.isWholeNumber(reply.content)) {
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