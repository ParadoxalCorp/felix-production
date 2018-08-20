const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Transactions extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'transactions',
                description: 'See the 10 latest transactions of your account',
                usage: '{prefix}transactions'
            },
            conf : {
                requireDB: true,
            },
        });
    }

    async run(client, message, args, guildEntry, userEntry) {
        if (!userEntry.economy.transactions[0]) {
            return message.channel.createMessage(':x: It seems you did not transfer or receive holy coins yet, so there\'s no transactions to display :v');
        }
        const splicedTransactions = this.mapSplicedTransactions(client, client.utils.paginate(userEntry.economy.transactions, 4));
        if (splicedTransactions.length < 2) {
            return message.channel.createMessage(splicedTransactions[0]);
        } else {
            return client.handlers.InteractiveList.createPaginatedMessage({
                channel: message.channel,
                messages: splicedTransactions,
                userID: message.author.id
            });
        }
    }

    mapSplicedTransactions(client, splicedTransactions) {
        return splicedTransactions.map(transactionGroup => {
            return {
                embed: {
                    title: 'Recent transactions',
                    fields: (() => {
                        const fields = [];
                        for (const transaction of transactionGroup) {
                            fields.push({
                                name: client.utils.timeConverter.toHumanDate(transaction.date),
                                value: '```diff\n' + `From: ${this.resolveUser(client, transaction.from).tag}\nTo: ${this.resolveUser(client, transaction.to).tag}\nCoins: ${transaction.amount < 0 ? transaction.amount : '+' + transaction.amount}` + '```',
                            });
                        }
                        return fields;
                    })(),
                    footer: {
                        text: `Showing page ${!splicedTransactions[1] ? '1/1' : '{index}/' + splicedTransactions.length }`
                    },
                    color: client.config.options.embedColor.generic
                }
            };
        });
    }
}

module.exports = new Transactions();