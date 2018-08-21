const FunCommands = require('../../structures/CommandCategories/FunCommands');

class Love extends FunCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'love',
                description: 'Love someone, bring some love to this world !',
                usage: '{prefix}love <count> <user_resolvable>',
            },
            conf: {
                requireDB: true,
                aliases: ['luv'],
                guildOnly: true,
            },
        });
    }

    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        let lp = context.client.utils.isWholeNumber(context.args[0]) && context.args[1] ? parseInt(context.args[0]) : 1;
        const remainingLps = this.getRemainingLps(context);
        if (!context.args[0]) {
            if (!remainingLps) {
                const remainingTime = context.client.utils.timeConverter.toElapsedTime(context.userEntry.getNearestCooldown('loveCooldown') - Date.now());
                return context.message.channel.createMessage(`:x: You already used all your love points, time remaining: ${remainingTime.days}d ${remainingTime.hours}h ${remainingTime.minutes}m ${remainingTime.seconds}s`);
            }
            return context.message.channel.createMessage(`You have \`${remainingLps}\` love point(s) available`);
        } else if (context.userEntry.isInCooldown('loveCooldown')) {
            const remainingTime = context.client.utils.timeConverter.toElapsedTime(context.userEntry.getNearestCooldown('loveCooldown') - Date.now());
            return context.message.channel.createMessage(`:x: You already used all your love points, time remaining: ${remainingTime.days}d ${remainingTime.hours}h ${remainingTime.minutes}m ${remainingTime.seconds}s`);
        }
        const user = lp === parseInt(context.args[0]) ? context.args.splice(1).join(' ') : context.args.join(' ');
        const targetUser = await this.getUserFromText({ client: this.client, message: context.message, text: user });
        if (!targetUser) {
            return context.message.channel.createMessage(`:x: I couldn't find the user you specified :v`);
        } else if (targetUser.id === context.message.author.id) {
            return context.message.channel.createMessage(`:x: Trying to love yourself eh? :eyes:`);
        }
        if (remainingLps < lp) {
            lp = remainingLps;
        }
        const targetEntry = await context.client.handlers.DatabaseWrapper.getUser(targetUser.id);
        targetEntry.love.amount = targetEntry.love.amount + lp;
        for (let i = 0; i < lp; i++) {
            context.userEntry.addCooldown('loveCooldown', context.client.config.options.loveCooldown);
        }
        await Promise.all([context.client.handlers.DatabaseWrapper.set(context.userEntry, 'user'), context.client.handlers.DatabaseWrapper.set(targetEntry, 'user')]);
        return context.message.channel.createMessage(`:heart: Haii ! You just gave **${lp}** love point to **${new context.client.structures.ExtendedUser(targetUser, context.client).tag}**`);
    }

    getRemainingLps(context) {
        const cooldownObj = context.userEntry.cooldowns.loveCooldown;
        let remainingLps = cooldownObj.max - cooldownObj.cooldowns.length; //In case the user is new and hasn't received the max cooldowns yet
        for (const cooldown of cooldownObj.cooldowns) {
            if (cooldown < Date.now()) {
                remainingLps++;
            }
        }
        return remainingLps;
    }
}

module.exports = Love;