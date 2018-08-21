const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Transactions extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'transactions',
                description: 'See the 10 latest transactions of your account',
                usage: '{prefix}transactions'
            },
            conf: {
                requireDB: true,
            }
        });
    }
    /** @param {import("../../structures/Contexts/EconomyContext")} context */

    async run(context) {
        if (!context.userEntry.economy.transactions[0]) {
            return context.message.channel.createMessage(':x: It seems you did not transfer or receive holy coins yet, so there\'s no transactions to display :v');
        }
        const splicedTransactions = await this.mapSplicedTransactions(context, context.client.utils.paginate(context.userEntry.economy.transactions, 4));
        if (splicedTransactions.length < 2) {
            return context.message.channel.createMessage(splicedTransactions[0]);
        } else {
            return context.client.handlers.InteractiveList.createPaginatedMessage({
                channel: context.message.channel,
                messages: splicedTransactions,
                userID: context.message.author.id
            });
        }
    }

    async mapSplicedTransactions(context, splicedTransactions) {
        let i = 0;
        for (let transactionGroup of splicedTransactions) {
            const fields = [];
            for (const transaction of transactionGroup) {
                const transactionUsers = await Promise.all([context.client.utils.helpers.fetchUser(transaction.from).then(u => u.tag), context.client.utils.helpers.fetchUser(transaction.to).then(u => u.tag)]);
                fields.push({
                    name: context.client.utils.timeConverter.toHumanDate(transaction.date),
                    value: '```diff\n' + `From: ${transactionUsers[0]}\nTo: ${transactionUsers[1]}\nCoins: ${transaction.amount < 0 ? transaction.amount : '+' + transaction.amount}` + '```',
                });
            }
            splicedTransactions[i] = {
                embed: {
                    title: 'Recent transactions',
                    fields,
                    footer: {
                        text: `Showing page ${!splicedTransactions[1] ? '1/1' : '{index}/' + splicedTransactions.length }`
                    },
                    color: context.client.config.options.embedColor.generic
                }
            };
            i++;
        }
        return splicedTransactions;
    }
}

module.exports = Transactions;