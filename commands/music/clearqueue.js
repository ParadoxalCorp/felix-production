'use strict';

const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class ClearQueue extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'clearqueue',
                description: 'Clear the queue',
                usage: '{prefix}clearqueue'
            },
            conf: { aliases: ['cq'] }
        });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        if (!context.connection || !context.connection.queue[0]) {
            const queue = await this.client.handlers.MusicManager.getQueueOf(context.message.channel.guild.id);
            if (queue[0]) {
                await this.client.handlers.RedisManager.del(`${context.message.channel.guild.id}-queue`);
                return context.message.channel.createMessage(':white_check_mark: Successfully cleared the queue');
            }
            return context.message.channel.createMessage(':x: There is nothing in the queue');
        }
        await context.connection.clearQueue();
        return context.message.channel.createMessage(`:white_check_mark: Successfully cleared the queue `);       
    }
}

module.exports = ClearQueue;