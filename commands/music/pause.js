'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class Pause extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true });
        this.help = {
            name: 'pause',
            description: 'Pause or resume the playback',
            usage: '{prefix}pause'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: [],
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
        await connection.player.setPause(connection.player.paused ? false : true);
        return message.channel.createMessage(`:white_check_mark: Successfully ${connection.player.paused ? 'paused' : 'resumed'} the playback`);       
    }
}

module.exports = Pause;