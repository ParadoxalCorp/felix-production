const ModerationCommands = require('../../structures/CommandCategories/ModerationCommands');

class ClearPermissions extends ModerationCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'clearpermissions',
                description: 'Clear all the permissions set until now, global, channels, roles and users permissions included',
                usage: '{prefix}clearpermissions',
                externalDoc: 'https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#permissions-system'
            },
            conf: {
                aliases: ['clearperms', 'nukeperms', 'cp'],
                requireDB: true,
                guildOnly: true,
            },
        });
    }

    /** @param {import("../../structures/Contexts/ModerationContext")} context */

    async run(context) {
        await context.message.channel.createMessage('Are you sure you want to do that? Reply with `yes` to confirm or anything else to abort');
        const confirmation = await context.client.handlers.MessageCollector.awaitMessage(context.message.channel.id, context.message.author.id);
        if (!confirmation || confirmation.content.toLowerCase().trim() !== 'yes') {
            return context.message.channel.createMessage(':x: Command aborted');
        }
        context.guildEntry.permissions = context.client.structures.References.guildEntry('1').permissions;
        await context.client.handlers.DatabaseWrapper.set(context.guildEntry, 'guild');
        return context.message.channel.createMessage(':white_check_mark: Successfully cleared all permissions');
    }
}

module.exports = ClearPermissions;