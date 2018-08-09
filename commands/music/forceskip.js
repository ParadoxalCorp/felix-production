'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class ForceSkip extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true });
        this.help = {
            name: 'forceskip',
            description: 'Force skip the currently playing song',
            usage: '{prefix}forceskip'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: ['fskip'],
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
        const skippedSong = connection.skipTrack();
        return message.channel.createMessage(`:white_check_mark: Skipped **${skippedSong.info.title}**`);       
    }
}

module.exports = ForceSkip;