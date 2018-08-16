'use strict';

const Command = require('../../structures/Command');

class RemoveDonator extends Command {
    constructor() {
        super();
        this.help = {
            name: 'removedonator',
            category: 'admin',
            description: 'Remove the premium status of a user',
            usage: '{prefix}removedonator <user_id>'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: ['removedonor', 'removepatron'],
            requirePerms: [],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        const donator = await client.handlers.DatabaseWrapper.getUser(args[0]);
        donator.premium = client.structures.References.userEntry(args[0]).premium;
        await client.handlers.DatabaseWrapper.set(donator);
        const user = await client.fetchUser(args[0]);
        return message.channel.createMessage(`:white_check_mark: Successfully disabled the premium status of the user **${user.tag}**`);
    }
}

module.exports = new RemoveDonator();