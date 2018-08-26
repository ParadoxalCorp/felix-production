const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Market extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'market',
                description: 'The place to see and purchase available items with holy coins',
                usage: '{prefix}market'
            }
        });
    }
    /** @param {import("../../structures/Contexts/EconomyContext")} context */

    async run(context) {
        return context.client.handlers.InteractiveList.createPaginatedMessage({
            channel: context.message.channel,
            userID: context.message.author.id,
            reactions: [{
                unicode: '🛒',
                callback: this.buyItem.bind(null, context)
            }],
            messages: this.mapItems(context)
        });
    }

    mapItems(context) {
        return context.client.handlers.EconomyManager.marketItems.map(item => {
            const price = typeof item.price === 'function' ? item.price(context) : item.price;
            return {
                embed: {
                    title: `Market | ${item.name} ${item.emote ? item.emote : ''}`,
                    description: `**Description** :notepad_spiral:\n${item.description}`,
                    fields: [{
                        name: 'Price :moneybag:',
                        value: `${price} holy coins`,
                        inline: true
                    }, {
                        name: 'Unique possession :question:',
                        value: item.buyableOnce ? ':white_check_mark:' : ':x:',
                        inline: true
                    }],
                    footer: {
                        text: `Showing page {index}/${context.client.handlers.EconomyManager.marketItems.length} ${context.client.config.admins.includes(context.message.author.id) ? '| Item ID: ' + item.id : ''}`
                    },
                    image: {
                        url: item.image
                    },
                    color: context.client.config.options.embedColor.generic

                },
                item //Will be used by buyItem
            };
        });
    }

    async buyItem(context, message, marketPage) {
        const item = marketPage.item;
        const price = typeof item.price === 'function' ? item.price(context) : item.price;
        if (item.buyableOnce && context.userEntry.hasItem(item.id)) {
            return context.message.channel.createMessage(':x: Sorry but this item is a unique possession and you already own one :v');
        } else if (price > context.userEntry.economy.coins) {
            return context.message.channel.createMessage(`:x: You need **${price - context.userEntry.economy.coins}** more holy coins to purchase that`);
        }
        context.userEntry.subtractCoins(price);
        context.userEntry.addItem(item);
        if (item.run) {
            item.run(context);
        }
        await context.userEntry.save();
        message.exit();
        return context.message.channel.createMessage(`:white_check_mark: The \`${item.name}\` has been added to your belongings, you now have \`${context.userEntry.economy.coins}\` holy coins`);
    }
}

module.exports = Market;