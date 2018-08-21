const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Daily extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'daily',
                description: 'Get your daily holy coins',
                usage: '{prefix}daily'
            }
        });
    }
    /** @param {import("../../structures/Contexts/EconomyContext")} context */

    async run(context) {
        if (context.userEntry.isInCooldown('dailyCooldown')) {
            return context.message.channel.createMessage(`Ahhh, I am very sorry but you still have to wait \`${context.client.utils.timeConverter.toElapsedTime(context.userEntry.cooldowns.dailyCooldown - Date.now(), true)}\` before using daily again`);
        }
        let randomEvent = context.client.config.options.economyEvents.dailyEvents ? context.client.utils.getRandomNumber(1, 100) <= context.client.config.options.economyEvents.dailyEventsRate : false;
        if (randomEvent) {
            randomEvent = this.runRandomDailyEvent(context);
        } else {
            context.userEntry.addCoins(context.client.config.options.dailyCoins);
        }
        context.userEntry.addCooldown('dailyCooldown', context.client.config.options.dailyCooldown);
        await context.client.handlers.DatabaseWrapper.set(randomEvent ? randomEvent.user : context.userEntry, "user");
        return context.message.channel.createMessage(randomEvent ? randomEvent.text : `Hai ! You received \`${context.client.config.options.dailyCoins}\` holy coins, you now have \`${context.userEntry.economy.coins}\` holy coins`);
    }

    runRandomDailyEvent(context) {
        const dailyEvent = context.client.handlers.EconomyManager.dailyEvents[context.client.utils.getRandomNumber(0, context.client.handlers.EconomyManager.dailyEvents.length - 1)];
        const eventCoinsChangeRate = Array.isArray(dailyEvent.changeRate) ? context.client.utils.getRandomNumber(dailyEvent.changeRate[0], dailyEvent.changeRate[1]) : dailyEvent.changeRate;
        const eventCoinsChange = Math.round(Math.abs(context.client.config.options.dailyCoins / 100 * eventCoinsChangeRate));
        const conditionalVariant = (() => {
            const conditionalVariants = dailyEvent.conditionalVariants.filter(v => v.condition(context.userEntry));
            const randomVariant = conditionalVariants[context.client.utils.getRandomNumber(0, conditionalVariants.length - 1)];
            return randomVariant && randomVariant.context ? randomVariant.context(context.userEntry) : randomVariant;
        })();
        const conditionalVariantSuccess = conditionalVariant ? context.client.utils.getRandomNumber(0, 100) < conditionalVariant.successRate : false;
        let resultText = 'Hai ! Here\'s your daily holy coins... Wait... ';
        if (conditionalVariant) {
            resultText += conditionalVariantSuccess ? conditionalVariant.success.replace(/{value}/gim, eventCoinsChange) : conditionalVariant.fail.replace(/{value}/gim, eventCoinsChange);
        } else {
            resultText += dailyEvent.context.message.replace(/{value}/gim, eventCoinsChange);
        }
        const coinsChange = conditionalVariantSuccess ? context.client.config.options.dailyCoins : eventCoinsChangeRate > 0 ? context.client.config.options.dailyCoins + eventCoinsChange : context.client.config.options.dailyCoins - eventCoinsChange;
        resultText += `\n\n\`${Math.ceil(Math.abs(coinsChange))}\` holy coins have been ${coinsChange > 0 ? 'credited to' : 'debited from'} your account, you now have \`${context.userEntry.economy.coins + Math.ceil(coinsChange)}\` holy coins`;
        if (coinsChange > 0) {
            context.userEntry.addCoins(Math.ceil(coinsChange));
        } else {
            context.userEntry.subtractCoins(Math.ceil(coinsChange));
        }
        return {
            text: resultText,
            user: context.userEntry
        };
    }
}

module.exports = Daily;