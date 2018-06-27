'use strict';

const Command = require('../../util/helpers/modules/Command');

class NowPlaying extends Command {
    constructor() {
        super();
        this.help = {
            name: 'nowplaying',
            category: 'music',
            description: 'Check the currently playing song',
            usage: '{prefix}nowplaying'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: ['np'],
            requirePerms: [],
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
        const connection = client.musicManager.connections.get(message.channel.guild.id);
        if (!connection || !connection.nowPlaying) {
            return message.channel.createMessage(':x: I am not playing anything');
        }
        let track = connection.nowPlaying;
        const output = await client.musicManager.genericEmbed(track, connection, 'Now playing');
        return message.channel.createMessage({embed: output});
    }
}

module.exports = new NowPlaying();