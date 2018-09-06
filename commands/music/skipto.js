const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class SkipTo extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'skipto',
                description: 'Start a vote to skip to the specified position in the queue',
                usage: '{prefix}skipto <position>'
            },
            conf: { aliases: ['voteskipto'] }
        }, { userInVC: true, playing: true });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        if (!context.connection.skipVote.count) {
            context.connection.skipVote.count = 1;
            context.connection.skipVote.id = Date.now();
            context.connection.queue[context.position].voteID = Date.now();
            context.connection.skipVote.callback = this.handleVoteEnd.bind(this, context, context.connection.queue[context.position]);
            context.connection.skipVote.timeout = setTimeout(this.handleVoteEnd.bind(this, context, context.connection.queue[context.position], 'timeout'), this.client.config.options.music.voteSkipDuration);
        } else {
            if (!context.connection.skipVote.id) {
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

    async processVote(context) {
        const voiceChannel = context.message.channel.guild.channels.get(context.message.channel.guild.members.get(this.client.bot.user.id).voiceState.channelID);
        const userCount = voiceChannel.voiceMembers.filter(m => !m.bot).length;
        const trackIndex = context.connection.queue.findIndex(track => track.voteID === context.connection.skipVote.id);
        const track = context.connection.queue[trackIndex];
        if (context.connection.skipVote.count >= (userCount === 2 ? 2 : (Math.ceil(userCount / 2)))) {
            context.connection.resetVote();
            context.connection.skipTrack(trackIndex);
            return context.message.channel.createMessage(`:white_check_mark: Successfully skipped to the song **${track.info.title}**`);
        }
        return context.message.channel.createMessage(`:white_check_mark: Successfully registered the vote to skip to the song **${track.info.title}**, as there is \`${userCount}\` users listening and already \`${context.connection.skipVote.count}\` voted, \`${userCount === 2 ? 1 : Math.ceil(userCount / 2) - context.connection.skipVote.count}\` more vote(s) are needed`);
    }

    async handleVoteEnd(context, song, reason) {
        switch (reason) {
        case 'timeout': 
            context.connection.resetVote();
            return context.message.channel.createMessage(`:x: The vote to the song **${song.info.title}** ended because not enough users voted`);
            break;
        case 'deleted':
            return context.message.channel.createMessage(`:x: The vote to skip to the song **${song.info.title}** ended because the song was removed from the queue`);
        case 'started': 
            return context.message.channel.createMessage(`:x: The vote to skip to the song **${song.info.title}** ended because the song just started`);
        }
    }
}

module.exports = SkipTo;