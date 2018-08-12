'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class Leave extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true });
        this.help = {
            name: 'leave',
            description: 'Stop playing and leave the voice channel',
            usage: '{prefix}leave'
        };
        this.conf = this.genericConf();
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        const connection = this.client.musicManager.connections.get(message.channel.guild.id);
        const voiceChannel = message.channel.guild.channels.get(message.channel.guild.members.get(this.client.bot.user.id).voiceState.channelID);
        if (!voiceChannel) {
            return message.channel.createMessage(':x: I am not in any voice channel');
        }
        return connection ? connection.leave() : voiceChannel.leave();
    }
}

module.exports = Leave;