'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class AddPlaylist extends MusicCommands {
    constructor(client) {
        super(client, {
            noArgs: ':x: You didn\'t specified a playlist link',
            userInVC: true,
            autoJoin: true
        });
        this.help = {
            name: 'addplaylist',
            description: 'Add a YouTube playlist to the queue, note that the link must be the link to the playlist, not to the first song of the playlist',
            usage: '{prefix}addplaylist <playlist_link>'
        };
        this.conf = this.genericConf({ aliases: ['ap'] });
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        const connection = await this.client.musicManager.getPlayer(message.channel.guild.channels.get(message.channel.guild.members.get(message.author.id).voiceState.channelID));
        let tracks = await this.client.musicManager.resolveTracks(connection.player.node, args.join(' '));
        if (!tracks[0]) {
            return message.channel.createMessage(`:x: I could not load this playlist :c`);
        }
        if (!connection.player.playing) {
            connection.play(tracks[0], message.author.id);
            tracks.shift();
        } 
        connection.addTracks(tracks, message.author.id);
        return message.channel.createMessage(`:musical_note: Successfully enqueued the playlist`);
    }
}

module.exports = AddPlaylist;