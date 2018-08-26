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
                requireDB: true
            }
        });
    }
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        const donator = await context.client.handlers.DatabaseWrapper.getUser(context.args[0]);
        donator.premium = context.client.structures.References.userEntry(context.args[0]).premium;
        await context.client.handlers.DatabaseWrapper.set(donator);
        const user = await context.client.utils.helpers.fetchUser(context.args[0]);
        return context.message.channel.createMessage(`:white_check_mark: Successfully disabled the premium status of the user **${user.tag}**`);
    }
}

module.exports = RemoveDonator;