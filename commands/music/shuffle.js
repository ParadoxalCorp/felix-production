'use strict';

const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class Shuffle extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true });
        this.help = {
            name: 'shuffle',
            description: 'Shuffle the queue',
            usage: '{prefix}shuffle <playlist_link>'
        };
        this.conf = this.genericConf();
    }
    /**
    * @param {import("../../structures/CommandCategories/MusicCommands.js").MusicContext} context The context
    */

    async run(context) {
        if (!context.connection || !context.connection.queue[0]) {
            return context.message.channel.createMessage(`:x: There is nothing in the queue to shuffle`);
        }
        context.connection.editQueue([...context.connection.queue].sort(() => Math.random() - Math.random()));
        return context.message.channel.createMessage(`:musical_note: Successfully shuffled the queue`);
    }
}

module.exports = Shuffle;