const FunCommands = require('../../structures/CommandCategories/MiscCommands');

class Iam extends FunCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'iam',
                description: 'Assign a self-assignable role to yourself, you can see the list of self-assignable roles set on this server with `{prefix}iam`',
                usage: '{prefix}iam <role_name>',
            },
            conf: {
                requirePerms: ["manageRoles"],
                guildOnly: true
            }
        });
    }

    /** @param {import("../../structures/Contexts/MiscContext")} context */

    async assignRole(context) {
        const role = context.guildEntry.selfAssignableRoles.find(r => r.id === context.guildRole.id);
        if (context.member.roles.find(r => r === context.guildRole.id)) {
            return context.message.channel.createMessage(':x: You already have this role');
        }
        if (role.incompatibleRoles.filter(r => context.member.roles.includes(r))[0]) {
            return context.message.channel.createMessage(':x: You cannot assign yourself this role because you have the role(s) ' + context.client.commands.get('uinfo').sliceRoles(role.incompatibleRoles.filter(r => context.member.roles.includes(r)).map(r => `\`${context.member.guild.roles.get(r).name}\``)));
        }
        if (this.getHighestRole(context.client.bot.user.id, context.message.channel.guild) && (context.guildRole.position > this.getHighestRole(context.client.bot.user.id, context.message.channel.guild).position)) {
            return context.message.channel.createMessage(`:x: The role \`${context.guildRole.name}\` is higher than my highest role, therefore, i can't give it to you :c`);
        }
        await context.member.addRole(context.guildRole.id);
        return context.message.channel.createMessage(":white_check_mark: Alright, i gave you the role `" + context.guildRole.name + "`");
    }
}

module.exports = Iam;