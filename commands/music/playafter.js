'use strict';

const Command = require('../../util/helpers/modules/Command');

class PlayAfter extends Command {
    constructor() {
        super();
        this.help = {
            name: 'playafter',
            category: 'music',
            description: 'Push to the first position in the queue a song. You can input: A `YouTube` URL (including livestreams), a `Soundcloud` URL, a `Twitch` channel URL (the channel must be live);\n\nOr a search term to search through `YouTube` or `Soundcloud`, by default the search is done on `YouTube`, to search through `Soundcloud`, you must specify it like `{prefix}queue soundcloud <search_term>`',
            usage: '{prefix}playafter <song_url|search_term>'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: [],
            requirePerms: ['voiceConnect', 'voiceSpeak'],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        if (!guildEntry.hasPremiumStatus()) {
            return message.channel.createMessage(':x: Sorry but as they are resources-whores, music commands are only available to our patreon donators. Check the `bot` command for more info');
        }
        let connection = client.musicManager.connections.get(message.channel.guild.id);
        if (!connection) {
            return message.channel.createMessage(':x: I am not playing anything');
        }
        if (!args[0]) {
            return message.channel.createMessage(':x: You didn\'t specified any song to play after this one');
        }
        let tracks = await client.musicManager.resolveTracks(connection.player.node, args.join(' '));
        let queued;
        let track = tracks[0];
        if (!track) {
            return message.channel.createMessage(`:x: I could not find any song :c, please make sure to:\n- Follow the syntax (check \`${client.commands.get('help').getPrefix(client, guildEntry)}help ${this.help.name}\`)\n- Use HTTPS links, unsecured HTTP links aren't supported\n- If a YouTube video, i can't play it if it is age-restricted\n - If a YouTube video, it might be blocked in the country my servers are`);
        }
        if (tracks.length > 1) {
            track = await client.commands.get('play').selectTrack(client, message, tracks);
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
        return message.channel.createMessage({embed: client.musicManager.genericEmbed(track, connection, queued ? 'Successfully enqueued to first position' : 'Now playing')});
    }
}

module.exports = new PlayAfter();