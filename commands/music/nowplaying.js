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

    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        return context.message.channel.createMessage({embed: await this.genericEmbed(context.currentTrack, context.connection, 'Now playing')});
    }
}

module.exports = NowPlaying;