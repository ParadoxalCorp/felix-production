'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class PlayAfter extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true, playing: true });
        this.help = {
            name: 'playafter',
            description: 'Push to the first position in the queue a song. You can input: A `YouTube` URL (including livestreams), a `Soundcloud` URL, a `Twitch` channel URL (the channel must be live);\n\nOr a search term to search through `YouTube` or `Soundcloud`, by default the search is done on `YouTube`, to search through `Soundcloud`, you must specify it like `{prefix}queue soundcloud <search_term>`',
            usage: '{prefix}playafter <song_url|search_term>'
        };
        this.conf = this.genericConf({ aliases: ['playnext'] });
    }
    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        if (!context.args[0]) {
            return context.message.channel.createMessage(':x: You didn\'t specify any song to play after this one');
        }
        let tracks = await this.client.musicManager.resolveTracks(context.connection.player.node, context.args.join(' '));
        let queued;
        let track = tracks[0];
        if (!track) {
            return context.message.channel.createMessage(`:x: I could not find any song :c, please make sure to:\n- Follow the syntax (check \`${this.getPrefix(context.guildEntry)}help ${this.help.name}\`)\n- Use HTTPS links, unsecured HTTP links aren't supported\n- If a YouTube video, I can't play it if it is age-restricted\n - If a YouTube video, it might be blocked in the country my servers are`);
        }
        if (tracks.length > 1) {
            track = await this.selectTrack(context, tracks);
            if (!track) {
                return;
            }
        }
        if (track.info.isStream) {
            return context.message.channel.createMessage(':x: I am sorry but you cannot add live streams to the queue, you can only play them immediately');
        }
        if (!context.connection.player.playing && !context.connection.player.paused) {
            context.connection.play(track, context.message.author.id);
        } else {
            context.connection.addTrack(track, context.message.author.id, true);
            queued = true;
        }
        return context.message.channel.createMessage({embed: await this.genericEmbed(track, context.connection, queued ? 'Successfully enqueued to first position' : 'Now playing')});
    }
}

module.exports = PlayAfter;