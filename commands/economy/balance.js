const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Balance extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'balance',
                description: 'Check your balance',
                usage: '{prefix}balance'
            },
            conf: {
                aliases: ['coins']
            },
        });
    }
    /** @param {import("../../structures/Contexts/EconomyContext")} context */

    async run(context) {
        return context.message.channel.createMessage(`Hai ! You currently have \`${context.userEntry.economy.coins}\` holy coins`);
    }
}

module.exports = Balance;