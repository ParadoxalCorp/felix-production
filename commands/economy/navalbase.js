const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class NavalBase extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'navalbase',
                description: 'Check your fleet',
                usage: '{prefix}navalbase'
            },
            conf: {
                aliases: ['fleet', 'port', 'nb', 'base']
            },
        });
    }
    /** @param {import("../../structures/Contexts/EconomyContext")} context */

    async run(context) {
        if (!context.userEntry.economy.items.filter(i => context.client.handlers.EconomyManager.getItem(i.id).family === "Ships")[0]) {
            return context.message.channel.createMessage(`:x: Sorry, but it seems like you don't own any ship yet :c`);
        }
        return context.message.channel.createMessage({
            embed: {
                title: ':ship: Naval Base - Fleet overview',
                fields: (() => {
                    let typesOwned = [];
                    for (const item of context.userEntry.economy.items) {
                        if (context.client.handlers.EconomyManager.getItem(item.id).data && !typesOwned.includes(context.client.handlers.EconomyManager.getItem(item.id).data.type) && context.client.handlers.EconomyManager.getItem(item.id).family === 'Ships') {
                            typesOwned.push(context.client.handlers.EconomyManager.getItem(item.id).data.type);
                        }
                    }
                    typesOwned = typesOwned.map(t => {
                        return {
                            name: `${t}(s)`,
                            value: context.client.handlers.EconomyManager.marketItems.filter(i => i.data && i.data.type === t && context.userEntry.hasItem(i.id)).map(i => i.name).join(', ')
                        };
                    });

                    return typesOwned;
                })(),
                color: context.client.config.options.embedColor.generic
            }
        });
    }
}

module.exports = NavalBase;