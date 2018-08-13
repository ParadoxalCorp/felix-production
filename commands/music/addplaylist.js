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
    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        let tracks = await this.client.musicManager.resolveTracks(context.connection.player.node, context.args.join(' '));
        if (tracks.loadType !== this.client.musicManager.constants.loadTypes.playlist) {
            return context.message.channel.createMessage(':x: Oops, this doesn\'t looks like a playlist to me, please use the `queue`, `play` and `playafter` commands for single tracks');
        }
        let playlistTracks = tracks.tracks;
        if (!playlistTracks[0]) {
            return context.message.channel.createMessage(`:x: I could not load this playlist :c`);
        }
        if (!context.connection.player.playing) {
            context.connection.play(playlistTracks[0], context.message.author.id);
            playlistTracks.shift();
        } 
        context.connection.addTracks(playlistTracks, context.message.author.id);
        return context.message.channel.createMessage(':musical_note: Successfully enqueued the playlist `' + tracks.playlistInfo.name + '`');
    }
}

module.exports = AddPlaylist;