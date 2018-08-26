const GenericCommands = require("../../structures/CommandCategories/GenericCommands");

class Prefix extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'prefix',
                description: `See ${client.config.codename}'s prefix on this server`,
                usage: '{prefix}prefix'
            },
            conf: {
                requireDB: true
            }
        });
    }
    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        return context.message.channel.createMessage(`My prefix here is \`${context.prefix}\`, you can use commands like \`${context.prefix}ping\``);
    }
}

module.exports = Prefix;