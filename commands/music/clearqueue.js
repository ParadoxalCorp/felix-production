'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class ClearQueue extends MusicCommands {
    constructor(client) {
        super(client);
        this.help = {
            name: 'clearqueue',
            description: 'Clear the queue',
            usage: '{prefix}clearqueue'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: ['cq'],
            requirePerms: ['voiceConnect', 'voiceSpeak'],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars 
    async run(message, args, guildEntry, userEntry) {
        const connection = this.client.musicManager.connections.get(message.channel.guild.id);
        if (!connection || !connection.queue[0]) {
            const queue = await this.client.musicManager.getQueueOf(message.channel.guild.id);
            if (queue[0]) {
                await this.client.redis.del(`${message.channel.guild.id}-queue`);
                return message.channel.createMessage(':white_check_mark: Successfully cleared the queue');
            }
            return message.channel.createMessage(':x: There is nothing in the queue');
        }
        await connection.clearQueue();
        return message.channel.createMessage(`:white_check_mark: Successfully cleared the queue `);       
    }
}

module.exports = ClearQueue;