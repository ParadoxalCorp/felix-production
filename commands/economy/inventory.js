const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Inventory extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'inventory',
                description: 'Check the items you possess',
                usage: '{prefix}inventory'
            }
        });
    }
    /** @param {import("../../structures/Contexts/EconomyContext")} context */

    async run(context) {
        if (!context.userEntry.economy.items[0]) {
            return context.message.channel.createMessage(`:x: Sorry, but it seems like you don't own any item yet :c`);
        }
        let ownedItemsWorth = 0;
        for (const item of context.client.handlers.EconomyManager.marketItems) {
            if (context.userEntry.hasItem(item.id)) {
                ownedItemsWorth = ownedItemsWorth + item.price;
            }
        }
        return context.message.channel.createMessage({
            embed: {
                title: ':package: Inventory',
                description: `Your owned items are worth a total of \`${ownedItemsWorth}\` holy coins (including ships).\n\nIf you are looking for your ships, you should check your naval base with the \`navalbase\` command instead`,
                fields: (() => {
                    let familiesOwned = [];
                    for (const item of context.userEntry.economy.items) {
                        if (!familiesOwned.includes(context.client.handlers.EconomyManager.getItem(item.id).family) && context.client.handlers.EconomyManager.getItem(item.id).family !== 'Ships') {
                            familiesOwned.push(context.client.handlers.EconomyManager.getItem(item.id).family);
                        }
                    }
                    familiesOwned = familiesOwned.map(f => {
                        return {
                            name: `${context.client.handlers.EconomyManager.marketItems.filter(i => i.family === f)[0].emote} ${f}`,
                            value: context.client.handlers.EconomyManager.marketItems.filter(i => i.family === f && context.userEntry.hasItem(i.id)).map(i => `${i.emote} ${i.name} (x${context.userEntry.economy.items.find(item => item.id === i.id).count})`).join(', ')
                        };
                    });

                    return familiesOwned;
                })(),
                color: context.client.config.options.embedColor.generic

            }
        });
    }
}

module.exports = Inventory;