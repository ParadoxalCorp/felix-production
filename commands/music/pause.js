'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class Pause extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true, playing: true });
        this.help = {
            name: 'pause',
            description: 'Pause or resume the playback',
            usage: '{prefix}pause'
        };
        this.conf = this.genericConf();
    }
    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        context.connection.player.setPause(context.connection.player.paused ? false : true);
        return context.message.channel.createMessage(`:white_check_mark: Successfully ${context.connection.player.paused ? 'paused' : 'resumed'} the playback`);       
    }
}

module.exports = Pause;