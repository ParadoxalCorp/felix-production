const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class Skip extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'skip',
                description: 'Start a vote to skip the currently playing song',
                usage: '{prefix}skip'
            },
            conf: { aliases: ['voteskip'] }
        }, { userInVC: true, playing: true });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        if (!context.connection.skipVote.count) {
            context.connection.skipVote.count = 1;
            context.connection.skipVote.callback = this.handleVoteEnd.bind(this, this.client, context);
            context.connection.skipVote.timeout = setTimeout(this.handleVoteEnd.bind(this, context, 'timeout'), this.client.config.options.music.voteSkipDuration);
        } else {
            if (context.connection.skipVote.id) {
                return context.message.channel.createMessage(`:x: Another vote to skip to the song **${context.connection.queue.find(t => t.voteID === context.connection.skipVote.id).info.title}** is already ongoing`);
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
        if (context.connection.skipVote.count >= (userCount === 2 ? 2 : (Math.ceil(userCount / 2)))) {
            context.connection.resetVote();
            const skippedSong = context.connection.skipTrack();
            return context.message.channel.createMessage(`:white_check_mark: Skipped **${skippedSong.info.title}**`);
        }
        return context.message.channel.createMessage(`:white_check_mark: Successfully registered the vote to skip the song, as there is \`${userCount}\` users listening and already \`${context.connection.skipVote.count}\` voted, \`${userCount === 2 ? 1 : Math.ceil(userCount / 2) - context.connection.skipVote.count}\` more vote(s) are needed`);
    }

    async handleVoteEnd(context, reason) {
        switch (reason) {
        case 'timeout': 
            context.connection.resetVote();
            return context.message.channel.createMessage(':x: The vote to skip the current song ended, not enough users voted');
            break;
        case 'ended':
            return context.message.channel.createMessage(':x: The vote to skip the current song has been cancelled because the song just ended');
            break;
        }
    }
}

module.exports = Skip;