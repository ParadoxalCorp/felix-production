const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Give extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'give',
                description: 'Give some of your holy coins to the specified user',
                usage: '{prefix}give <user> <coins>'
            },
            conf: {
                aliases: ['transfer'],
                guildOnly: true,
                expectedArgs: [{
                    description: 'To which user should i give the coins? You can specify a nickname, a username or a user ID'
                }, {
                    description: 'How many coins do you want to give?'
                }]
            },
        });
    }
    /** @param {import("../../structures/Contexts/EconomyContext")} context */

    async run(context) {
        const userInput = context.args.length >= 2 ? context.args.slice(0, context.args.length - 1) : false;
        if (!userInput) {
            return context.message.channel.createMessage(`:x: Invalid syntax or missing parameters, the correct syntax should be \`${this.help.usage.replace(/{prefix}/gim, context.guildEntry.prefix || context.client.config.prefix)}\``);
        }
        const receiver = await context.getUserFromText(userInput.join(" "));
        const coins = context.client.utils.isWholeNumber(context.args[context.args.length - 1]) ? Number(context.args[context.args.length - 1]) : false;
        if (!receiver || !coins) {
            return context.message.channel.createMessage(!receiver ? ':x: I couldn\'t find the user you specified' : ':x: Please specify a whole number !');
        } else if (coins > context.userEntry.economy.coins) {
            return context.message.channel.createMessage(':x: Yeah well, how to say this.. you can\'t give more coins than you have..');
        }
        //@ts-ignore
        const receiverEntry = await context.client.handlers.DatabaseWrapper.getUser(receiver.id) || context.client.structures.References.userEntry(receiver.id);
        const transaction = await context.client.handlers.EconomyManager.transfer({ from: context.userEntry, to: receiverEntry, amount: coins });
        //@ts-ignore
        return context.message.channel.createMessage(`:white_check_mark: You just transferred \`${transaction.donor.debited}\` of your holy coins to \`${receiver.username + '#' + receiver.discriminator}\``);
    }
}

module.exports = Give;