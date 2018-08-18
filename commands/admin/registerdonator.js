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

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        if (!args[0] || !args[1]) {
            return message.channel.createMessage(`:x: Missing args`);
        }
        if (!client.utils.isWholeNumber(args[0])) {
            return message.channel.createMessage('The specified tier is not a whole number :angery:');
        }
        const newDonator = await client.handlers.DatabaseWrapper.getUser(args[1]);
        newDonator.premium.tier = parseInt(args[0]);
        newDonator.premium.expire = args[2] ? Date.now() + parseInt(args[2]) : true;
        await client.handlers.DatabaseWrapper.set(newDonator);
        const user = await client.utils.utils.fetchUser(args[1]);
        let res = `:white_check_mark: Successfully given premium status to the user \`${user.tag}\` at tier \`${args[0]}\`\n\n`;
        if (args[2]) {
            res += `The premium status of this user will expire in **${client.utils.timeConverter.toElapsedTime(args[2], true)}** the **${client.utils.timeConverter.toHumanDate(newDonator.premium.expire, true)}**`;
        }
        return message.channel.createMessage(res);
    }
}

module.exports = new RegisterDonator();