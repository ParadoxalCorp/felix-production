const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class RemoveDonator extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'removedonator',
                description: 'Remove the premium status of a user',
                usage: '{prefix}removedonator <user_id>'
            },
            conf: {
                aliases: ['removedonor', 'removepatron', "rmdonor", "rmpatron"],
                requireDB: true,
                guildOnly: true,
            }
        });
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        const donator = await client.handlers.DatabaseWrapper.getUser(args[0]);
        donator.premium = client.structures.References.userEntry(args[0]).premium;
        await client.handlers.DatabaseWrapper.set(donator);
        const user = await client.utils.helpers.fetchUser(args[0]);
        return message.channel.createMessage(`:white_check_mark: Successfully disabled the premium status of the user **${user.tag}**`);
    }
}

module.exports = new RemoveDonator();