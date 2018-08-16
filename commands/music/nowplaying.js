'use strict';

const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class NowPlaying extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'nowplaying',
                description: 'Check the currently playing song',
                usage: '{prefix}nowplaying'
            },
            conf: { aliases: ['np'] }
        }, { playing: true });
    }

    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        return context.message.channel.createMessage({embed: await this.genericEmbed(context.currentTrack, context.connection, 'Now playing')});
    }
}

module.exports = NowPlaying;