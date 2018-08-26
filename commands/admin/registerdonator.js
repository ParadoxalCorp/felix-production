const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class RegisterDonator extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'registerdonator',
                description: 'Register a new donator and give them premium status, omit the `<duration_in_milliseconds>` parameter to not set any expiration date',
                usage: '{prefix}registerdonator <tier> | <user_id> | <duration_in_milliseconds>'
            },
            conf: {
                aliases: ['registerdonor', 'registerpatron', "regpatron", "regdonor"],
                requireDB: true,
            }
        });
    }
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        if (!context.args[0] || !context.args[1]) {
            return context.message.channel.createMessage(`:x: Missing context.args`);
        }
        if (!context.client.utils.isWholeNumber(context.args[0])) {
            return context.message.channel.createMessage('The specified tier is not a whole number :angery:');
        }
        const newDonator = await context.client.handlers.DatabaseWrapper.getUser(context.args[1]);
        newDonator.premium.tier = parseInt(context.args[0]);
        newDonator.premium.expire = context.args[2] ? Date.now() + parseInt(context.args[2]) : true;
        if (newDonator.premium.tier >= 4) {
            newDonator.cooldowns.loveCooldown.max = newDonator.cooldowns.loveCooldown.max + (newDonator.premium.tier - 3);
            newDonator.addCoins(5e7);
            if (newDonator.premium.tier >= 5) {
                newDonator.addCoins(1e9);
            }
        }
        await context.client.handlers.DatabaseWrapper.set(newDonator);
        const user = await context.client.utils.helpers.fetchUser(context.args[1]);
        let res = `:white_check_mark: Successfully given premium status to the user \`${user.tag}\` at tier \`${context.args[0]}\`\n\n`;
        if (context.args[2]) {
            res += `The premium status of this user will expire in **${context.client.utils.timeConverter.toElapsedTime(context.args[2], true)}** the **${context.client.utils.timeConverter.toHumanDate(newDonator.premium.expire, true)}**`;
        }
        return context.message.channel.createMessage(res);
    }
}

module.exports = RegisterDonator;