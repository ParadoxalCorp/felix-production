const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Inventory extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'inventory',
                description: 'Check the items you possess',
                usage: '{prefix}inventory'
            },
            conf : {
                requireDB: true,
            },
        });
    }

    async run(client, message, args, guildEntry, userEntry) {
        if (!userEntry.economy.items[0]) {
            return message.channel.createMessage(`:x: Sorry, but it seems like you don't own any item yet :c`);
        }
        return message.channel.createMessage(this.mapItems(client, userEntry));
    }

    mapItems(client, userEntry) {
        let ownedItemsWorth = 0;
        for (const item of client.handlers.EconomyManager.marketItems) {
            if (userEntry.hasItem(item.id)) {
                ownedItemsWorth = ownedItemsWorth + item.price;
            }
        }
        return {
            embed: {
                title: ':package: Inventory',
                description: `Your owned items are worth a total of \`${ownedItemsWorth}\` holy coins (including ships).\n\nIf you are looking for your ships, you should check your naval base with the \`navalbase\` command instead`,
                fields: (() => {
                    let familiesOwned = [];
                    for (const item of userEntry.economy.items) {
                        if (!familiesOwned.includes(client.handlers.EconomyManager.getItem(item.id).family) && client.handlers.EconomyManager.getItem(item.id).family !== 'Ships') {
                            familiesOwned.push(client.handlers.EconomyManager.getItem(item.id).family);
                        }
                    }
                    familiesOwned = familiesOwned.map(f => {
                        return {
                            name: `${client.handlers.EconomyManager.marketItems.filter(i => i.family === f)[0].emote} ${f}`,
                            value: client.handlers.EconomyManager.marketItems.filter(i => i.family === f && userEntry.hasItem(i.id)).map(i => `${i.emote} ${i.name} (x${userEntry.economy.items.find(item => item.id === i.id).count})`).join(', ')
                        };
                    });

                    return familiesOwned;
                })(),
                color: client.config.options.embedColor

            }
        };
    }
}

module.exports = new Inventory();