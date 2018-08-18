const FunCommands = require('../../structures/CommandCategories/FunCommands');

class Love extends FunCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'love',
                description: 'Love someone, bring some love to this world !',
                usage: '{prefix}love <count> <user_resolvable>',
            },
            conf : {
                requireDB: true,
                aliases: ['luv'],
                guildOnly: true,
            },
        });
    }


    async run(client, message, args, guildEntry, userEntry) {
        let lp = client.utils.isWholeNumber(args[0]) && args[1] ? parseInt(args[0]) : 1;
        const remainingLps = this.getRemainingLps(userEntry);
        if (!args[0]) {
            if (!remainingLps) {
                const remainingTime = client.utils.timeConverter.toElapsedTime(userEntry.getNearestCooldown('loveCooldown') - Date.now());
                return message.channel.createMessage(`:x: You already used all your love points, time remaining: ${remainingTime.days}d ${remainingTime.hours}h ${remainingTime.minutes}m ${remainingTime.seconds}s`);
            }
            return message.channel.createMessage(`You have \`${remainingLps}\` love point(s) available`);
        } else if (userEntry.isInCooldown('loveCooldown')) {
            const remainingTime = client.utils.timeConverter.toElapsedTime(userEntry.getNearestCooldown('loveCooldown') - Date.now());
            return message.channel.createMessage(`:x: You already used all your love points, time remaining: ${remainingTime.days}d ${remainingTime.hours}h ${remainingTime.minutes}m ${remainingTime.seconds}s`);
        }
        const user = lp === parseInt(args[0]) ? args.splice(1).join(' ') : args.join(' ');
        const targetUser = await this.getUserFromText({ client: client, message: message, text: user });
        if (!targetUser) {
            return message.channel.createMessage(`:x: I couldn't find the user you specified :v`);
        } else if (targetUser.id === message.author.id) {
            return message.channel.createMessage(`:x: Trying to love yourself eh? :eyes:`);
        }
        if (remainingLps < lp) {
            lp = remainingLps;
        }
        const targetEntry = await client.handlers.DatabaseWrapper.getUser(targetUser.id);
        targetEntry.love.amount = targetEntry.love.amount + lp;
        for (let i = 0; i < lp; i++) {
            userEntry.addCooldown('loveCooldown', client.config.options.loveCooldown);
        }
        await Promise.all([client.handlers.DatabaseWrapper.set(userEntry, 'user'), client.handlers.DatabaseWrapper.set(targetEntry, 'user')]);
        return message.channel.createMessage(`:heart: Haii ! You just gave **${lp}** love point to **${new client.structures.ExtendedUser(targetUser).tag}**`);
    }

    getRemainingLps(userEntry) {
        const cooldownObj = userEntry.cooldowns.loveCooldown;
        let remainingLps = cooldownObj.max - cooldownObj.cooldowns.length; //In case the user is new and hasn't received the max cooldowns yet
        for (const cooldown of cooldownObj.cooldowns) {
            if (cooldown < Date.now()) {
                remainingLps++;
            }
        }
        return remainingLps;
    }
}

module.exports = new Love();