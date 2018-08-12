'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class NowPlaying extends MusicCommands {
    constructor(client) {
        super(client, { playing: true });
        this.help = {
            name: 'nowplaying',
            description: 'Check the currently playing song',
            usage: '{prefix}nowplaying'
        };
        this.conf = this.genericConf({ aliases: ['np'] });
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        const connection = this.client.musicManager.connections.get(message.channel.guild.id);
        let track = connection.nowPlaying;
        const output = await this.client.musicManager.genericEmbed(track, connection, 'Now playing');
        return message.channel.createMessage({embed: output});
    }
}

module.exports = NowPlaying;