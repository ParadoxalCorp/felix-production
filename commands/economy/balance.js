const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Balance extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'balance',
                description: 'Check your balance',
                usage: '{prefix}balance'
            },
            conf : {
                aliases: ['coins'],
                requireDB: true,
            },
        });
    }

    async run(client, message, args, guildEntry, userEntry) {
        return message.channel.createMessage(`Hai ! You currently have \`${userEntry.economy.coins}\` holy coins`);
    }
}

module.exports = new Balance();