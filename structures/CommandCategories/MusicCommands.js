/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../HandlersStructures/musicConnection").FelixTrack} FelixTrack
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("../Contexts/MusicContext")} MusicContext
* @typedef {import("../HandlersStructures/MusicConnection").LavalinkTrack} LavalinkTrack
* @typedef {import("../HandlersStructures/MusicConnection").FelixTrack} FelixTrack
* @typedef {import("eris").Message} Message
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
        return { passed: true, callback: ['skip', 'skipto'].includes(this.help.name) ? this.runVote : null };
    }

    /**
     * 
     * @param {MusicContext} context - The context
     * @returns {Promise<Message>} The message
     */
    async runVote(context) {
        if (!context.connection.skipVote.count) {
            context.connection.skipVote.count = 1;
            if (this.help.name === 'skipto') {
                context.connection.skipVote.id = Date.now();
                context.connection.queue[context.position].voteID = Date.now();
            }
            context.connection.skipVote.callback = this.handleVoteEnd.bind(this, context, context.connection.queue[context.position]);
            context.connection.skipVote.timeout = setTimeout(this.handleVoteEnd.bind(this, context, context.connection.queue[context.position], 'timeout'), this.client.config.options.music.voteSkipDuration);
        } else {
            if ((context.connection.skipVote.id && this.help.name === 'skip') || (context.connection.skipVote.id && context.connection.queue[context.position].voteID !== context.connection.skipVote.id)) {
                return context.message.channel.createMessage(`:x: Another vote to skip to the song **${context.connection.queue.find(t => t.voteID === context.connection.skipVote.id).info.title}** is already ongoing`);
            } else if (!context.connection.skipVote.id && this.help.name === 'skipto') {
                return context.message.channel.createMessage(':x: A vote to skip the current song is already ongoing');
            }
            if (context.connection.skipVote.voted.includes(context.message.author.id)) {
                return context.message.channel.createMessage(':x: You already voted to skip this song');
            }
            context.connection.skipVote.count = context.connection.skipVote.count + 1;
        }
        context.connection.skipVote.voted.push(context.message.author.id);
        return this.processVote(context);
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

    /**
     * 
     * @param {MusicContext} context - The context
     * @param {FelixTrack | LavalinkTrack} [song] - The song to which this vote was aiming to skip to, if any
     * @param {String} reason - The reason of the vote's end
     * @returns {Promise<Message>} The message
     */
    handleVoteEnd(context, song, reason) {
        if (typeof song === 'string') {
            reason = song;
        }
        switch (reason) {
        case 'timeout': 
            context.connection.resetVote();
            return context.message.channel.createMessage(this.help.name === 'skipto' ? 
                `:x: The vote to skip to the song **${song.info.title}** ended because not enough users voted` :
                ':x: The vote to skip the current song ended, not enough users voted');
            break;
        case 'deleted':
            return context.message.channel.createMessage(`:x: The vote to skip to the song **${song.info.title}** ended because the song was removed from the queue`);
            break;
        case 'started': 
            return context.message.channel.createMessage(`:x: The vote to skip to the song **${song.info.title}** ended because the song just started`);
            break;
        case 'ended':
            return context.message.channel.createMessage(':x: The vote to skip the current song has been cancelled because the song just ended');
            break;
        }
    }

    /**
     * 
     * @param {MusicContext} context - The context
     * @returns {Promise<Message>} The message
     */
    processVote(context) {
        const voiceChannel = context.message.channel.guild.channels.get(context.message.channel.guild.members.get(this.client.bot.user.id).voiceState.channelID);
        const userCount = voiceChannel.voiceMembers.filter(m => !m.bot).length;
        let [trackIndex, track] = [];
        if (this.help.name === 'skipto') {
            trackIndex = context.connection.queue.findIndex(track => track.voteID === context.connection.skipVote.id);
            track = context.connection.queue[trackIndex];
        }
        if (context.connection.skipVote.count >= (userCount === 2 ? 2 : (Math.ceil(userCount / 2)))) {
            context.connection.resetVote();
            const skippedSong = context.connection.skipTrack(trackIndex);
            return context.message.channel.createMessage(track ? 
                `:white_check_mark: Successfully skipped to the song **${track.info.title}**` :
                `:white_check_mark: Skipped **${skippedSong.info.title}**`);
        }
        const action = track ? `to skip to the song **${track.info.title}**` : 'to skip the song';
        return context.message.channel.createMessage(`:white_check_mark: Successfully registered the vote ${action}, as there is \`${userCount}\` users listening and already \`${context.connection.skipVote.count}\` voted, \`${userCount === 2 ? 1 : Math.ceil(userCount / 2) - context.connection.skipVote.count}\` more vote(s) are needed`);
    }
}

module.exports = MusicCommands;