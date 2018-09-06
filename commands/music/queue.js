const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class Queue extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'queue',
                description: 'Queue a song or check the queue, to check the queue, just run `{prefix}queue`. You can input: A `YouTube` URL (including livestreams), a `Soundcloud` URL, a `Twitch` channel URL (the channel must be live);\n\nOr a search term to search through `YouTube` or `Soundcloud`, by default the search is done on `YouTube`, to search through `Soundcloud`, you must specify it like `{prefix}queue soundcloud <search_term>`',
                usage: '{prefix}queue <song_url|search_term>'
            }
        });
    }
    /** @param {import("../../structures/Contexts/MusicContext")} context The context */

    async run(context) {
        const member = context.message.channel.guild.members.get(context.message.author.id);
        const clientMember = context.message.channel.guild.members.get(this.client.bot.user.id);
        if (!context.args[0]) {
            let queue = context.connection ? context.connection.queue : await this.client.handlers.MusicManager.getQueueOf(context.message.channel.guild.id);
            if (!queue[0]) {
                return context.message.channel.createMessage(`:x: There is nothing in the queue`);
            }
            return this.formatQueue(context, queue);
        }
        if (!member.voiceState.channelID) {
            return context.message.channel.createMessage(':x: You are not connected to any voice channel');
        }
        if (!clientMember.voiceState.channelID) {
            if (Array.isArray(this.this.clientHasPermissions(context.message, this.client, ['voiceConnect', 'voiceSpeak'], context.message.channel.guild.channels.get(member.voiceState.channelID)))) {
                return context.message.channel.createMessage(':x: It seems like I lack the permission to connect or to speak in the voice channel you are in :c');
            }
        }
        if (!context.connection) {
            context.connection = await this.client.handlers.MusicManager.getPlayer(context.message.channel.guild.channels.get(member.voiceState.channelID));
        }
        const resolvedTracks = await this.client.handlers.MusicManager.resolveTracks(context.connection.player.node, context.args.join(' '));
        if (resolvedTracks.loadType === this.client.handlers.MusicManager.constants.loadTypes.playlist) {
            return context.message.channel.createMessage(':x: Oops, this looks like a playlist to me, please use the `addplaylist` command instead');
        }
        let queued;
        let track = resolvedTracks.tracks[0];
        if (!track) {
            return context.message.channel.createMessage(`:x: I could not find any song :c, please make sure to:\n- Follow the syntax (check \`${context.prefix}help ${this.help.name}\`)\n- Use HTTPS links, unsecured HTTP links aren't supported\n- If a YouTube video, I can't play it if it is age-restricted\n - If a YouTube video, it might be blocked in the country my servers are`);
        }
        if (resolvedTracks.tracks.length > 1) {
            track = await this.selectTrack(context, resolvedTracks.tracks);
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
            queued = context.connection.addTrack(track, context.message.author.id);
        }
        return context.message.channel.createMessage({embed: {
            title: `:musical_note: ${queued ? 'Successfully enqueued' : 'Now playing'}`,
            description: `[${track.info.title}](${track.info.uri})`,
            fields: [{
                name: 'Author',
                value: track.info.author,
                inline: true
            }, {
                name: 'Duration',
                value: this.client.handlers.MusicManager.parseDuration(track),
                inline: true
            }, {
                name: 'Estimated time until playing',
                value: this.client.handlers.MusicManager.parseDuration(queued.timeUntilPlaying)
            }],
            color: this.client.config.options.embedColor.generic
        }});
    }

    formatQueue(context, connectionQueue) {
        let formattedQueue = [this.queuePage(context)];
        if (context.connection) {
            formattedQueue[0].embed.description = `${context.emote("headphones")} Now playing: [${this.shorten(context.connection.nowPlaying.info.title)}](${context.connection.nowPlaying.info.uri}) `;
            formattedQueue[0].embed.description += `(${this.client.handlers.MusicManager.parseDuration(context.connection.player.state.position)}/${this.client.handlers.MusicManager.parseDuration(context.connection.nowPlaying)})\n`;
            formattedQueue[0].embed.description += `Repeat: ${this.client.commands.get('repeat').extra[context.connection.repeat].emote}\n\n`;
        }
        let page = 0;
        let i = 1;
        let queue = [...connectionQueue];
        for (const track of queue) {
            if (formattedQueue[page].embed.description.length >= 1800) {
                formattedQueue.push(this.queuePage(context));
                page++;
            } 
            formattedQueue[page].embed.description += `\`${i++}\` - [${this.shorten(track.info.title)}](${track.info.uri}) (\`${this.client.handlers.MusicManager.parseDuration(track)}\`) `;
            formattedQueue[page].embed.description += track.info.requestedBy ? `<@!${track.info.requestedBy}>\n` : '\n';
        }
        for (i = 0; i < formattedQueue.length; i++) {
            let textToAdd = '\n\n';
            if (formattedQueue.length > 1) {
                textToAdd += 'Showing page {index}/{length}';
            } 
            if (context.connection) {
                textToAdd += (formattedQueue.length > 1 ? ' | ' : '') + `Total queue estimated duration: ${this.client.handlers.MusicManager.parseDuration(context.connection.queueDuration)}`;
            }
            formattedQueue[i].embed.footer = {
                text: textToAdd
            };
        }
        formattedQueue[0].embed.description = formattedQueue.length > 1 ? formattedQueue[0].embed.description : formattedQueue[0].embed.description.replace(/undefined/gim, '');
        return formattedQueue.length > 1 
            ? context.client.handlers.InteractiveList.createPaginatedMessage({channel: context.message.channel, messages: formattedQueue, userID: context.message.author.id}) 
            : context.message.channel.createMessage(formattedQueue[0]);
    }

    queuePage(context) {
        return {
            embed: {
                description: '',
                title: `${context.emote('musicalNote')} ${context.message.channel.guild.name}'s queue`,
                fields: [],
                color: context.client.config.options.embedColor.generic,
            }
        };
    }

    shorten(string) {
        if (string.length > 45) {
            return (string.substr(0, 43) + '..').replace(/\[/gm, '(').replace(/\]/gm, ')');
        }
        return string.replace(/\[/gm, '(').replace(/\]/gm, ')');
    }
}

module.exports = Queue;