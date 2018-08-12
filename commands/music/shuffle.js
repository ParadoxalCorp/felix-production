'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

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

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        let connection = this.client.musicManager.connections.get(message.channel.guild.id);
        if (!connection || !connection.queue[0]) {
            return message.channel.createMessage(`:x: There is nothing in the queue to shuffle`);
        }
        connection.editQueue([...connection.queue].sort(() => Math.random() - Math.random()));
        return message.channel.createMessage(`:musical_note: Successfully shuffled the queue`);
    }
}

module.exports = Shuffle;