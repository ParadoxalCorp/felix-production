'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class PlayAfter extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true });
        this.help = {
            name: 'playafter',
            description: 'Push to the first position in the queue a song. You can input: A `YouTube` URL (including livestreams), a `Soundcloud` URL, a `Twitch` channel URL (the channel must be live);\n\nOr a search term to search through `YouTube` or `Soundcloud`, by default the search is done on `YouTube`, to search through `Soundcloud`, you must specify it like `{prefix}queue soundcloud <search_term>`',
            usage: '{prefix}playafter <song_url|search_term>'
        };
        this.conf = this.genericConf({ aliases: ['playnext'] });
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        let connection = this.client.musicManager.connections.get(message.channel.guild.id);
        if (!connection) {
            return message.channel.createMessage(':x: I am not playing anything');
        }
        if (!args[0]) {
            return message.channel.createMessage(':x: You didn\'t specify any song to play after this one');
        }
        let tracks = await this.client.musicManager.resolveTracks(connection.player.node, args.join(' '));
        let queued;
        let track = tracks[0];
        if (!track) {
            return message.channel.createMessage(`:x: I could not find any song :c, please make sure to:\n- Follow the syntax (check \`${this.client.commands.get('help').getPrefix(this.client, guildEntry)}help ${this.help.name}\`)\n- Use HTTPS links, unsecured HTTP links aren't supported\n- If a YouTube video, I can't play it if it is age-restricted\n - If a YouTube video, it might be blocked in the country my servers are`);
        }
        if (tracks.length > 1) {
            track = await this.client.commands.get('play').selectTrack(this.client, message, tracks);
            if (!track) {
                return;
            }
        }
        if (track.info.isStream) {
            return message.channel.createMessage(':x: I am sorry but you cannot add live streams to the queue, you can only play them immediately');
        }
        if (!connection.player.playing && !connection.player.paused) {
            connection.play(track, message.author.id);
        } else {
            connection.addTrack(track, message.author.id, true);
            queued = true;
        }
        const output = await this.client.musicManager.genericEmbed(track, connection, queued ? 'Successfully enqueued to first position' : 'Now playing');
        return message.channel.createMessage({embed: output});
    }
}

module.exports = PlayAfter;