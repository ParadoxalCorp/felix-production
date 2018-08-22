const EconomyCommands = require('../../structures/CommandCategories/EconomyCommands');

class Slots extends EconomyCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'slots',
                description: 'Gamble your holy coins on your luck, and if you dont have any luck, well, good luck.\n\nYou can use the `--noEmbed` option to send the slots results without an embed, like `{prefix}slots 200 --noEmbed`. Note that this is case-insensitive',
                usage: '{prefix}slots <coins>',
            },
            conf: {
                cooldownWeight: 2
            },
            // @ts-ignore
        });
        this.extra = {
            slotsOutputs: [{
                multiplier: 1,
                name: ":cherries:"
            }, {
                multiplier: 1,
                name: ":french_bread:"
            }, {
                multiplier: 1,
                name: ":beer:"
            }, {
                multiplier: 1,
                name: ":coffee:"
            }, {
                multiplier: 2,
                name: ":gem:"
            }, {
                multiplier: -1,
                name: ":money_with_wings:"
            }, {
                multiplier: -1,
                name: ":bomb:"
            }, {
                multiplier: -1,
                name: ":space_invader:"
            }, {
                multiplier: -1,
                name: ":gun:"
            }, {
                multiplier: -1,
                name: ":coffin:"
            }]
        };
    }
    /** @param {import("../../structures/Contexts/EconomyContext")} context */

    async run(context) {
        if (!context.args[0]) {
            return context.message.channel.createMessage(`You currently have \`${context.userEntry.economy.coins}\` holy coins`);
        }
        const gambledCoins = Number(context.args[0]);
        if (!context.client.utils.isWholeNumber(gambledCoins) || gambledCoins <= 0) {
            return context.message.channel.createMessage(':x: Please input a whole number');
        }
        if (gambledCoins > context.userEntry.economy.coins) {
            return context.message.channel.createMessage(`:x: I am very sorry but you only have \`${context.userEntry.economy.coins}\` holy coins, you can't gamble more than that`);
        }
        const animatedSlots = context.client.config.options.animatedSlotsEmote && !(new RegExp(/--noRoll/gim).test(context.message.content)) ? await this.runAnimatedSlots(context) : false;
        const slots = this.runSlots(context);
        if (!slots.match) {
            return this.sendResults(context, slots, "**Nothing**, you don't lose nor win any holy coins, everyone's happy right?", animatedSlots);
        }
        const randomSlotsEvent = context.client.utils.getRandomNumber(1, 100) <= context.client.config.options.economyEvents.slotsEventsRate;
        const coinsChange = Math.round(gambledCoins * (slots.match[0].multiplier * (slots.match.length - 1)));
        if (randomSlotsEvent && context.client.config.options.economyEvents.slotsEvents) {
            return this.runRandomSlotsEvent(context, slots, coinsChange, animatedSlots);
        } else if (coinsChange < 0) {
            return this.outputLostGamble(context, slots, coinsChange, randomSlotsEvent, animatedSlots);
        } else {
            return this.outputWonGamble(context, slots, coinsChange, randomSlotsEvent, animatedSlots);
        }
    }

    runSlots(context) {
        const getLine = () => { return this.extra.slotsOutputs[context.client.utils.getRandomNumber(0, this.extra.slotsOutputs.length - 1)]; };
        const results = [getLine()];
        //Increase the chances of having a two-lines match
        results.push(context.client.utils.getRandomNumber(0, 5) !== 0 ? results[0] : getLine(), getLine());

        return {
            getLine: getLine,
            results: results,
            match: (() => {
                for (const result of results) {
                    if (results.filter(r => r.name === result.name).length >= 2) {
                        return results.filter(r => r.name === result.name);
                    }
                }
                return false;
            })()
        };

    }

    sendResults(context, slots, resultText, animatedSlots) {
        const noEmbed = new RegExp(/--noEmbed/gim).test(context.message.content);
        let slotsResults = "You run the slots, and...\n\n---------------------\n";
        slotsResults += `-| ${slots.getLine().name} | ${slots.getLine().name} | ${slots.getLine().name} |-\n`;
        slotsResults += `>| ${slots.results[0].name} | ${slots.results[1].name}| ${slots.results[2].name} |<\n`;
        slotsResults += `-| ${slots.getLine().name} | ${slots.getLine().name} | ${slots.getLine().name} |-\n\n`;
        slotsResults += `----------------------\n`;
        slotsResults += resultText;
        if (!animatedSlots) {
            return context.message.channel.createMessage(noEmbed ? slotsResults.replace(/undefined/gim, '') : {
                embed: {
                    title: ":slot_machine: Slots",
                    description: slotsResults.replace(/undefined/gim, ''),
                    color: context.client.config.options.embedColor.generic
                }
            });
        } else {
            return animatedSlots.edit(noEmbed ? slotsResults.replace(/undefined/gim, '') : {
                embed: {
                    title: ":slot_machine: Slots",
                    description: slotsResults.replace(/undefined/gim, ''),
                    color: context.client.config.options.embedColor.generic
                }
            });
        }
    }

    runAnimatedSlots(context) {
        return new Promise(async(resolve) => {
            const noEmbed = new RegExp(/--noEmbed/gim).test(context.message.content);
            const animatedEmote = context.client.config.options.animatedSlotsEmote;
            let slotsResults = "You run the slots, and...\n\n---------------------\n";
            slotsResults += `-| ${animatedEmote} | ${animatedEmote} | ${animatedEmote} |-\n`;
            slotsResults += `>| ${animatedEmote} | ${animatedEmote} | ${animatedEmote} |<\n`;
            slotsResults += `-| ${animatedEmote} | ${animatedEmote} | ${animatedEmote} |-\n\n`;
            slotsResults += `----------------------\n`;
            const animatedSlots = await context.message.channel.createMessage(noEmbed ? slotsResults.replace(/undefined/gim, '') : {
                embed: {
                    title: ":slot_machine: Slots",
                    description: slotsResults.replace(/undefined/gim, ''),
                    color: context.client.config.options.embedColor.generic
                }
            });
            setTimeout(() => {
                return resolve(animatedSlots);
            }, 2000);
        });
    }

    async outputLostGamble(context, slots, lostCoins, randomEvent, animatedSlots) {
        //In case the user lose/win coins during the slots animation, fetch the latest coins amount
        if (animatedSlots) {
            context.userEntry = await context.client.handlers.DatabaseWrapper.getUser(context.userEntry.id);
        }
        context.userEntry.economy.coins = (context.userEntry.economy.coins + lostCoins) < 0 ? 0 : context.userEntry.economy.coins + lostCoins;
        await context.client.handlers.DatabaseWrapper.set(context.userEntry, "user");
        const resultText = `${randomEvent ? (randomEvent + '\n\n') : 'You **lose**, '}\`${Math.abs(lostCoins)}\` holy coins has been debited from your account. You now have \`${context.userEntry.economy.coins}\` holy coins`;
        return this.sendResults(context, slots, resultText, animatedSlots);
    }

    async outputWonGamble(context, slots, wonCoins, randomEvent, animatedSlots) {
        if (animatedSlots) {
            context.userEntry = await context.client.handlers.DatabaseWrapper.getUser(context.userEntry.id);
        }
        wonCoins = Math.ceil(wonCoins);
        context.userEntry.economy.coins = (context.userEntry.economy.coins + wonCoins) >= context.client.config.options.coinsLimit ?
            context.client.config.options.coinsLimit : context.userEntry.economy.coins + wonCoins;
        await context.client.handlers.DatabaseWrapper.set(context.userEntry, "user");
        const resultText = `${randomEvent ? (randomEvent + '\n\n') : 'You **win**, '}\`${wonCoins}\` holy coins has been credited to your account. You now have \`${context.userEntry.economy.coins}\` holy coins`;
        return this.sendResults(context, slots, resultText, animatedSlots);
    }

    runRandomSlotsEvent(context, slots, coinsChange, animatedSlots) {
        const filteredSlotsEvents = context.client.handlers.EconomyManager.slotsEvents.filter(e => e.case === (coinsChange > 0 ? 'won' : 'lost'));
        const slotsEvent = filteredSlotsEvents[context.client.utils.getRandomNumber(0, filteredSlotsEvents.length - 1)];
        const eventCoinsChangeRate = Array.isArray(slotsEvent.changeRate) ? context.client.utils.getRandomNumber(slotsEvent.changeRate[0], slotsEvent.changeRate[1]) : slotsEvent.changeRate;
        const eventCoinsChange = Math.round(Math.abs(coinsChange / 100 * eventCoinsChangeRate));
        const conditionalVariant = (() => {
            const conditionalVariants = slotsEvent.conditionalVariants.filter(v => v.condition(context.userEntry));
            const randomVariant = conditionalVariants[context.client.utils.getRandomNumber(0, conditionalVariants.length - 1)];
            return randomVariant && randomVariant.context ? randomVariant.context(context.userEntry) : randomVariant;
        })();
        const conditionalVariantSuccess = conditionalVariant ? context.client.utils.getRandomNumber(0, 100) < conditionalVariant.successRate : false;
        let resultText;
        let targetFunc;
        if (coinsChange > 0) {
            resultText += 'You **win** ! But... ';
            targetFunc = this.outputWonGamble.bind(this);
        } else {
            resultText += 'You **lose** ! But... ';
            targetFunc = this.outputLostGamble.bind(this);
        }
        if (conditionalVariant) {
            resultText += conditionalVariantSuccess ? conditionalVariant.success.replace(/{value}/gim, eventCoinsChange) : conditionalVariant.fail.replace(/{value}/gim, eventCoinsChange);
        } else {
            resultText += slotsEvent.context.message.replace(/{value}/gim, eventCoinsChange);
        }
        return targetFunc(context, slots, conditionalVariantSuccess ? coinsChange : (eventCoinsChangeRate > 0 ? coinsChange + eventCoinsChange : coinsChange - eventCoinsChange), resultText, animatedSlots);
    }
}

module.exports = Slots;