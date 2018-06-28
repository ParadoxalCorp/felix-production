'use strict';

const Command = require('../../util/helpers/modules/Command');

class Skip extends Command {
    constructor() {
        super();
        this.help = {
            name: 'skipto',
            category: 'music',
            description: 'Start a vote to skip to the specified position in the queue',
            usage: '{prefix}skipto <position>'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: ['skipVoteto'],
            requirePerms: ['voiceConnect', 'voiceSpeak'],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        if (!guildEntry.hasPremiumStatus()) {
            return message.channel.createMessage(':x: Sorry but as they are resources-whores, music commands are only available to our patreon donators. Check the `bot` command for more info');
        }
        const connection = client.musicManager.connections.get(message.channel.guild.id);
        if (!connection || !connection.nowPlaying) {
            return message.channel.createMessage(':x: I am not playing anything');
        }
        let position = args[0];
        if (!position || !client.isWholeNumber(position) || connection.queue[parseInt(position) - 1] > connection.queue.length || connection.queue[parseInt(position) - 1] < 0) {
            return message.channel.createMessage(':x: You did not specify a valid number ! You must specify a number corresponding to the position in the queue of the song you want to skip to');
        }
        position = parseInt(position) - 1;
        if (!connection.skipVote.count) {
            connection.skipVote.count = 1;
            connection.skipVote.id = Date.now();
            connection.queue[position].voteID = Date.now();
            connection.skipVote.callback = this.handleVoteEnd.bind(this, client, message, connection, connection.queue[position]);
            connection.skipVote.timeout = setTimeout(this.handleVoteEnd.bind(this, client, message, connection, connection.queue[position], 'timeout'), client.config.options.music.voteSkipDuration);
        } else {
            if (!connection.skipVote.id) {
                return message.channel.createMessage(':x: A vote to skip the current song is already ongoing');
            }
            if (connection.skipVote.voted.includes(message.author.id)) {
                return message.channel.createMessage(':x: You already voted to skip this song');
            }
            connection.skipVote.count = connection.skipVote.count + 1;
        }
        connection.skipVote.voted.push(message.author.id);
        return this.processVote(client, message, connection);
    }

    async processVote(client, message, connection) {
        const voiceChannel = message.channel.guild.channels.get(message.channel.guild.members.get(client.bot.user.id).voiceState.channelID);
        const userCount = voiceChannel.voiceMembers.filter(m => !m.bot).length;
        const trackIndex = connection.queue.findIndex(track => track.voteID === connection.skipVote.id);
        const track = connection.queue[trackIndex];
        if (connection.skipVote.count >= (userCount === 2 ? 2 : (Math.ceil(userCount / 2)))) {
            connection.resetVote();
            connection.skipTrack(trackIndex);
            return message.channel.createMessage(`:white_check_mark: Successfully skipped to the song **${track.info.title}**`);
        }
        return message.channel.createMessage(`:white_check_mark: Successfully registered the vote to skip to the song **${track.info.title}**, as there is \`${userCount}\` users listening and already \`${connection.skipVote.count}\` voted, \`${userCount === 2 ? 1 : Math.ceil(userCount / 2) - connection.skipVote.count}\` more vote(s) are needed`);
    }

    async handleVoteEnd(client, message, connection, song, reason) {
        switch (reason) {
            case 'timeout': 
                return message.channel.createMessage(`:x: The vote to the song **${song.info.title}** ended because not enough users voted`);
                break;
            case 'deleted':
                return message.channel.createMessage(`:x: The vote to skip to the song **${song.info.title}** ended because the song was removed from the queue`);
            case 'started': 
                return message.channel.createMessage(`:x: The vote to skip to the song **${song.info.title}** ended because the song just started`);
        }
    }
}

module.exports = new Skip();