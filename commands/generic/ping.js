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

    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        const startTime = Date.now();
        const messageSent = await context.message.channel.createMessage(context.emote('ping'));
        return messageSent.edit(`~~Baguette~~ Pong | \`${Date.now() - startTime}\`ms`);
    }
}

module.exports = new Ping();