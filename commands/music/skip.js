'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class Skip extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true });
        this.help = {
            name: 'skip',
            description: 'Start a vote to skip the currently playing song',
            usage: '{prefix}skip'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: ['skipVote'],
            requirePerms: ['voiceConnect', 'voiceSpeak'],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        const connection = this.client.musicManager.connections.get(message.channel.guild.id);
        if (!connection || !connection.nowPlaying) {
            return message.channel.createMessage(':x: I am not playing anything');
        }
        if (!connection.skipVote.count) {
            connection.skipVote.count = 1;
            connection.skipVote.callback = this.handleVoteEnd.bind(this, this.client, message, connection);
            connection.skipVote.timeout = setTimeout(this.handleVoteEnd.bind(this, message, connection, 'timeout'), this.client.config.options.music.voteSkipDuration);
        } else {
            if (connection.skipVote.id) {
                return message.channel.createMessage(`:x: Another vote to skip to the song **${connection.queue.find(t => t.voteID === connection.skipVote.id).info.title}** is already ongoing`);
            }
            if (connection.skipVote.voted.includes(message.author.id)) {
                return message.channel.createMessage(':x: You already voted to skip this song');
            }
            connection.skipVote.count = connection.skipVote.count + 1;
        }
        connection.skipVote.voted.push(message.author.id);
        return this.processVote(message, connection);
    }

    async processVote(message, connection) {
        const voiceChannel = message.channel.guild.channels.get(message.channel.guild.members.get(this.client.bot.user.id).voiceState.channelID);
        const userCount = voiceChannel.voiceMembers.filter(m => !m.bot).length;
        if (connection.skipVote.count >= (userCount === 2 ? 2 : (Math.ceil(userCount / 2)))) {
            connection.resetVote();
            const skippedSong = connection.skipTrack();
            return message.channel.createMessage(`:white_check_mark: Skipped **${skippedSong.info.title}**`);
        }
        return message.channel.createMessage(`:white_check_mark: Successfully registered the vote to skip the song, as there is \`${userCount}\` users listening and already \`${connection.skipVote.count}\` voted, \`${userCount === 2 ? 1 : Math.ceil(userCount / 2) - connection.skipVote.count}\` more vote(s) are needed`);
    }

    async handleVoteEnd(message, connection, reason) {
        switch (reason) {
            case 'timeout': 
                connection.resetVote();
                return message.channel.createMessage(':x: The vote to skip the current song ended, not enough users voted');
                break;
            case 'ended':
                return message.channel.createMessage(':x: The vote to skip the current song has been cancelled because the song just ended');
                break;
        }
    }
}

module.exports = Skip;