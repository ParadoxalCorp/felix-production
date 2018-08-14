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
        const resolvedTracks = await this.client.musicManager.resolveTracks(context.connection.player.node, context.args.join(' '));
        if (resolvedTracks.loadType !== this.client.musicManager.constants.loadTypes.playlist) {
            return context.message.channel.createMessage(':x: Oops, this doesn\'t looks like a playlist to me, please use the `queue`, `play` and `playafter` commands for single tracks');
        }
        if (!resolvedTracks.tracks[0]) {
            return context.message.channel.createMessage(`:x: I could not load this playlist :c`);
        } else if (context.userEntry.tierLimits.playlistLoadLimit < resolvedTracks.tracks.length) {
            return context.message.channel.createMessage(`:x: You cannot load a playlist of over \`${context.userEntry.tierLimits.playlistLoadLimit}\` songs :v, you can increase this limit by becoming a donator`);
        }
        if (!context.connection.player.playing) {
            context.connection.play(resolvedTracks.tracks[0], context.message.author.id);
            resolvedTracks.tracks.shift();
        } 
        context.connection.addTracks(resolvedTracks.tracks, context.message.author.id);
        return context.message.channel.createMessage(':musical_note: Successfully enqueued the playlist `' + resolvedTracks.tracks.playlistInfo.name + '`');
    }
}

module.exports = AddPlaylist;