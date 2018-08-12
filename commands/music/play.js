'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class Play extends MusicCommands {
    constructor(client) {
        super(client, { userInVC: true, autoJoin: true });
        this.help = {
            name: 'play',
            description: 'Play a song, you can input: A `YouTube` URL (including livestreams), a `Soundcloud` URL, a `Twitch` channel URL (the channel must be live);\n\nOr a search term to search through `YouTube` or `Soundcloud`, by default the search is done on `YouTube`, to search through `Soundcloud`, you must specify it like `{prefix}play soundcloud <search_term>`',
            usage: '{prefix}play <song_url|search_term>'
        };
        this.conf = this.genericConf();
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        const member = message.channel.guild.members.get(message.author.id);
        const connection = await this.client.musicManager.getPlayer(message.channel.guild.channels.get(member.voiceState.channelID));
        let track;
        if (!args[0]) {
            await connection.defer;
            if (connection.queue[0]) {
                track = connection.queue[0];
                if (connection.player.paused) {
                    connection.player.setPause(false);
                } else {
                    connection.queue.shift();
                }
            } else {
                return message.channel.createMessage(':x: You didn\'t specified any songs to play and there is nothing in the queue');
            }
        }
        let tracks = track ? [] : await this.client.musicManager.resolveTracks(connection.player.node, args.join(' '));
        track = track ? track : tracks[0];
        if (!track) {
            return message.channel.createMessage(`:x: I could not find any song :c, please make sure to:\n- Follow the syntax (check \`${this.client.commands.get('help').getPrefix(this.client, guildEntry)}help ${this.help.name}\`)\n- Use HTTPS links, unsecured HTTP links aren't supported\n- If a YouTube video, I can't play it if it is age-restricted\n - If a YouTube video, it might be blocked in the country my servers are`);
        }
        if (tracks.length > 1) {
            track = await this.selectTrack(message, tracks);
            if (!track) {
                return;
            }
        }
        connection.play(track, message.author.id);
        const output = await this.client.musicManager.genericEmbed(track, connection, 'Now playing');
        return message.channel.createMessage({embed: output});
    }

    async selectTrack(message, tracks) {
        tracks = tracks.splice(0, 15);
        let searchResults = `Your search has returned multiple results, please select one by replying their corresponding number\n\n`;
        let i = 1;
        for (const song of tracks) {
            searchResults += `\`${i++}\` - **${song.info.title}** by **${song.info.author}** (${this.client.musicManager.parseDuration(song)})\n`;
        }
        await message.channel.createMessage(searchResults);
        const reply = await this.client.messageCollector.awaitMessage(message.channel.id, message.author.id);
        if (!reply) {
            message.channel.createMessage(':x: Timeout, command aborted').catch(() => {});
            return false;
        } else if (!this.client.isWholeNumber(reply.content)) {
            message.channel.createMessage(':x: You must reply with a whole number').catch(() => {});
            return false;
        }
        if (reply.content >= tracks.length) {
            return tracks[tracks.length - 1];
        } else if (reply.content <= 1) {
            return tracks[0];
        } else {
            return tracks[reply.content - 1];
        }
    }
}

module.exports = Play;