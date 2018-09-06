/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../HandlersStructures/musicConnection").FelixTrack} FelixTrack
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("../Contexts/MusicContext")} MusicContext
*/

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

    /** 
     * @param {MusicContext} context - The context
     * @returns {Promise<Object>} An object representing whether the category check passed
     */
    async categoryCheck(context) {
        if (this.options.userInVC && (context.clientMember.voiceState.channelID && context.clientMember.voiceState.channelID !== context.member.voiceState.channelID)) {
            return context.message.channel.createMessage(':x: You must be connected in a voice channel with me to use that');
        } 
        if (this.options.autoJoin && !context.clientMember.voiceState.channelID) {
            if (context.hasPermissions(['voiceConnect', 'voiceSpeak'], context.clientMember, context.userVC).missingPerms) {
                return context.message.channel.createMessage(':x: It seems like I lack the permission to connect or to speak in the voice channel you are in :c');
            }
            if (context.userVC) {
                await this.client.handlers.MusicManager.getPlayer(context.userVC).then(p => context.connection = p);
            }
        }
        if (this.options.playing) {
            if (!context.connection || !context.connection.nowPlaying) {
                return context.message.channel.createMessage(':x: I am not playing anything');
            }
        }
        if (['skipto', 'removesong', 'forceskipto'].includes(this.help.name)) {
            let position = context.args[0];
            if (!this.isValidPosition(position, context.connection.queue)) {
                return context.message.channel.createMessage(`:x: You did not specify a valid number ! You must specify a number corresponding to the position in the queue of the song you want to ${this.help.name === 'removesong' ? 'remove' : 'skip to'}`);
            }
            context.position = parseInt(position) - 1;
        }
        return { passed: true };
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
        await context.context.message.channel.createMessage(searchResults);
        const reply = await this.client.handlers.MessageCollector.awaitMessage(context.context.message.channel.id, context.context.message.author.id);
        if (!reply) {
            context.context.message.channel.createMessage(':x: Timeout, command aborted').catch(() => {});
            return false;
        } else if (!this.client.utils.isWholeNumber(reply.content)) {
            context.context.message.channel.createMessage(':x: You must reply with a whole number').catch(() => {});
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