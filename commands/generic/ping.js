'use strict';

const GenericCommands = require('../../structures/CommandCategories/GenericCommands');

class Ping extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'ping',
                description: 'pong',
                usage: '{prefix}ping',
            }
        });
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        const startTime = Date.now();
        const messageSent = await message.channel.createMessage(`Baguetting the hell outta Diskurd...`);
        return messageSent.edit(`~~Baguette~~ Pong | \`${Date.now() - startTime}\`ms`);
    }
}

module.exports = new Ping();