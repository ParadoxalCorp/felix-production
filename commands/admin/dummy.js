const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class Dummy extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'dummy',
                description: 'dummy',
                usage: '{prefix}dummy'
            }
        });
    }
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        if (!context.args[0]) {
            return context.message.channel.createMessage('not used atm');
        }
        if (context.args[0] === 'category') {
            const category = await context.getChannelFromText(context.args.slice(1).join(' '), 'category');
            return context.message.channel.createMessage(`Resolved ${category.name}`);
        } else if (context.args[0] === 'voice') {
            const voiceChannel = await context.getChannelFromText(context.args.slice(1).join(' '), 'voice');
            return context.message.channel.createMessage(`Resolved ${voiceChannel.name}`);
        } else if (context.args[0] === 'channel') {
            const textChannel = await context.getChannelFromText(context.args.slice(1).join(' '), 'text');
            return context.message.channel.createMessage(`Resolved <#${textChannel.id}>`);
        } else if (context.args[0] === 'role') {
            const role = await context.getRoleFromText(context.args.slice(1).join(' '));
            return context.message.channel.createMessage(`Resolved <@&${role.id}>`);
        } else if (context.args[0] === 'user') {
            const user = await context.getUserFromText(context.args.slice(1).join(' '));
            return context.message.channel.createMessage(`Resolved <@${user.id}>`);
        }
    }
}

module.exports = Dummy;