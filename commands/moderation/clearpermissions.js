'use strict';

const Command = require('../../structures/Command');

class ClearPermissions extends Command {
    constructor() {
        super();
        this.help = {
            name: 'clearpermissions',
            category: 'moderation',
            description: 'Clear all the permissions set until now, global, channels, roles and users permissions included',
            usage: '{prefix}clearpermissions',
            externalDoc: 'https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#permissions-system'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: ['clearperms', 'nukeperms', 'cp'],
            requirePerms: [],
            guildOnly: true,
            ownerOnly: false,
            guildOwnerOnly: true,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        await message.channel.createMessage('Are you sure you want to do that? Reply with `yes` to confirm or anything else to abort');
        const confirmation = await client.handlers.MessageCollector.awaitMessage(message.channel.id, message.author.id);
        if (!confirmation || confirmation.content.toLowerCase().trim() !== 'yes') {
            return message.channel.createMessage(':x: Command aborted');
        }
        guildEntry.permissions = client.structures.References.guildEntry('1').permissions;
        await client.handlers.DatabaseWrapper.set(guildEntry, 'guild');
        return message.channel.createMessage(':white_check_mark: Successfully cleared all permissions');
    }
}

module.exports = new ClearPermissions();