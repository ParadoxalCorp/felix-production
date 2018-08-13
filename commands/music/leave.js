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
    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        if (!context.clientVC) {
            return context.message.channel.createMessage(':x: I am not in any voice channel');
        }
        return context.connection ? context.connection.leave() : context.clientVC.leave();
    }
}

module.exports = Leave;