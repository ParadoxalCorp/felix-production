'use strict';

const MusicCommands = require('../../structures/CommandCategories/MusicCommandss.js');

class Play extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'play',
                description: 'Play a song, you can input: A `YouTube` URL (including livestreams), a `Soundcloud` URL, a `Twitch` channel URL (the channel must be live);\n\nOr a search term to search through `YouTube` or `Soundcloud`, by default the search is done on `YouTube`, to search through `Soundcloud`, you must specify it like `{prefix}play soundcloud <search_term>`',
                usage: '{prefix}play <song_url|search_term>'
            },
        }, { userInVC: true, autoJoin: true });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext.js")} context The context
    */

    async run(context) {
        let track;
        if (!context.args[0]) {
            if (context.connection.queue[0]) {
                track = context.connection.queue[0];
                if (context.connection.player.paused) {
                    context.connection.player.setPause(false);
                } else if (context.connection.nowPlaying) {
                    return context.message.channel.createMessage(':x: You should specify something to play');
                } else {
                    context.connection.queue.shift();
                }
            } else {
                return context.message.channel.createMessage(':x: You didn\'t specified any songs to play and there is nothing in the queue');
            }
        }
        let tracks = track ? [] : await this.client.handlers.MusicManager.resolveTracks(context.connection.player.node, context.args.join(' '));
        if (tracks.loadType === this.client.handlers.MusicManager.constants.loadTypes.playlist) {
            return context.message.channel.createMessage(':x: Oops, this looks like a playlist to me, please use the `addplaylist` command instead');
        }
        track = track ? track : tracks.tracks[0];
        if (!track) {
            return context.message.channel.createMessage(`:x: I could not find any song :c, please make sure to:\n- Follow the syntax (check \`${this.getPrefix(context.guildEntry)}help ${this.help.name}\`)\n- Use HTTPS links, unsecured HTTP links aren't supported\n- If a YouTube video, I can't play it if it is age-restricted\n - If a YouTube video, it might be blocked in the country my servers are`);
        }
        if (tracks.length > 1) {
            track = await this.selectTrack(context, tracks);
            if (!track) {
                return;
            }
        }
        context.connection.play(track, context.message.author.id);
        return context.message.channel.createMessage({embed: await this.genericEmbed(track, context.connection, 'Now playing', true)});
    }
}

module.exports = Play;