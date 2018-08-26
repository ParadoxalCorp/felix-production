const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class AddPlaylist extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'addplaylist',
                description: 'Add a YouTube playlist to the queue, note that the link must be the link to the playlist, not to the first song of the playlist',
                usage: '{prefix}addplaylist <playlist_link|playlist_id>'
            },
            conf: {
                aliases: ['ap'],
                expectedArgs: [{description: 'Please specify a playlist link or a saved playlist ID'}],
                requireDB: true
            }
        }, { userInVC: true, autoJoin: true });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext.js")} context The context
    */

    async run(context) {
        if (context.client.utils.isWholeNumber(context.args[0].replace(/\-/g, ""))) {
            const savedPlaylist = await context.client.handlers.DatabaseWrapper.rethink.table("playlists").get(context.args[0]).run();
            if (!savedPlaylist) {
                return context.message.channel.createMessage(`:x: I couldn't find any playlist with that ID :v`);
            }
            savedPlaylist.tracks.map(t => {
                t.info = {
                    ...t.info,
                    requestedBy: context.message.author.id,
                    position: 0,
                    isSeekable: true,
                    isStream: false
                };
            });
            if (!context.connection.player.playing) {
                context.connection.play(savedPlaylist.tracks[0], context.message.author.id);
                savedPlaylist.tracks.shift();
            } 
            context.connection.addTracks(savedPlaylist.tracks);
            const playlistAuthor = await context.client.utils.helpers.fetchUser(savedPlaylist.userID) || `Unknown user (${savedPlaylist.userID})`;
            return context.message.channel.createMessage(`:white_check_mark: Successfully loaded the playlist \`${savedPlaylist.name}\` by \`${playlistAuthor.tag || playlistAuthor}\``);
        }

        const resolvedTracks = await context.client.handlers.MusicManager.resolveTracks(context.connection.player.node, context.args.join(' '));
        if (resolvedTracks.loadType !== context.client.handlers.MusicManager.constants.loadTypes.playlist) {
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
        return context.message.channel.createMessage(':musical_note: Successfully enqueued the playlist `' + resolvedTracks.playlistInfo.name + '`');
    }
}

module.exports = AddPlaylist;