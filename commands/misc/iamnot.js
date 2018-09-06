const FunCommands = require('../../structures/CommandCategories/MiscCommands');

class IamNot extends FunCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'iamnot',
                description: 'Remove a self-assignable role from yourself, you can see the list of self-assignable roles set on this server with `{prefix}iamnot',
                usage: '{prefix}iamnot <role_name>',
            },
            conf: {
                requirePerms: ["manageRoles"],
                guildOnly: true
            }
        });
    }

    /** @param {import("../../structures/Contexts/MiscContext")} context */

    async removeRole(context) {
        if (!context.member.roles.includes(context.guildRole.id)) {
            return context.message.channel.createMessage(':x: You do not have this role, therefore I can\'t remove it');
        }
        if (this.getHighestRole(context.client.bot.user.id, context.message.channel.guild) && (context.guildRole.position > this.getHighestRole(context.client.bot.user.id, context.message.channel.guild).position)) {
            return context.message.channel.createMessage(`:x: The role \`${context.guildRole.name}\` is higher than my highest role, therefore, I can't give/remove it from you :c`);
        }
        await context.member.removeRole(context.guildRole.id);
        return context.message.channel.createMessage(":white_check_mark: Alright, I removed from you the role `" + context.guildRole.name + "`");
    }
}

module.exports = IamNot;