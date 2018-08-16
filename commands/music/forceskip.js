'use strict';

const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class ForceSkip extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true, playing: true });
        this.help = {
            name: 'forceskip',
            description: 'Force skip the currently playing song',
            usage: '{prefix}forceskip'
        };
        this.conf = this.genericConf({ aliases: ['fskip'] });
    }
    /**
    * @param {import("../../structures/CommandCategories/MusicCommands.js").MusicContext} context The context
    */

    async run(context) {
        const skippedSong = context.connection.skipTrack();
        return context.message.channel.createMessage(`:white_check_mark: Skipped \`${skippedSong.info.title}\` by \`${skippedSong.info.author}\``);       
    }
}

module.exports = ForceSkip;