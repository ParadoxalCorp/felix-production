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
        this.conf = this.genericConf({ aliases: ['cq'] });
    }
    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        if (!context.connection || !context.connection.queue[0]) {
            const queue = await this.client.musicManager.getQueueOf(context.message.channel.guild.id);
            if (queue[0]) {
                await this.client.redis.del(`${context.message.channel.guild.id}-queue`);
                return context.message.channel.createMessage(':white_check_mark: Successfully cleared the queue');
            }
            return context.message.channel.createMessage(':x: There is nothing in the queue');
        }
        await context.connection.clearQueue();
        return context.message.channel.createMessage(`:white_check_mark: Successfully cleared the queue `);       
    }
}

module.exports = ClearQueue;