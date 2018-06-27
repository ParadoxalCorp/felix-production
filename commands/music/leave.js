'use strict';

const Command = require('../../util/helpers/modules/Command');

class Leave extends Command {
    constructor() {
        super();
        this.help = {
            name: 'leave',
            category: 'music',
            description: 'Stop playing and leave the voice channel',
            usage: '{prefix}leave'
        };
        this.conf = {
            requireDB: false,
            disabled: false,
            aliases: ['stop'],
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
        const connection = client.musicManager.connections.get(message.channel.guild.id);
        if (!connection) {
            return message.channel.createMessage(':x: I am not in any voice channel');
        }
        return connection.leave();
    }
}

module.exports = new Leave();