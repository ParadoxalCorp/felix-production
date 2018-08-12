'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class RemoveSong extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true, playing: true });
        this.help = {
            name: 'removesong',
            description: 'Remove the song at the specified position in the queue',
            usage: '{prefix}removesong <position>'
        };
        this.conf = this.genericConf({ aliases: ['rs'] });
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        const connection = this.client.musicManager.connections.get(message.channel.guild.id);
        let position = args[0];
        if (!this.isValidPosition(position, connection.queue)) {
            return message.channel.createMessage(':x: You did not specify a valid number ! You must specify a number corresponding to the position in the queue of the song you want to skip to');
        }
        position = parseInt(position) - 1;
        const removedTrack = connection.removeTrack(position);
        return message.channel.createMessage(`:white_check_mark: Successfully removed the track \`${removedTrack.info.title}\` by \`${removedTrack.info.author}\``);
    }
}

module.exports = RemoveSong;