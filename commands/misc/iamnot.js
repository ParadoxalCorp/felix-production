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

    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        context.guildEntry.selfAssignableRoles = context.guildEntry.selfAssignableRoles.filter(r => context.message.channel.guild.roles.has(r.id)); //Filter deleted roles
        if (!context.args[0]) {
            return this.createList(context);
        } else {
            return this.removeRole(context);
        }
    }

    createList(context) {
        if (!context.guildEntry.selfAssignableRoles[0]) {
            return context.message.channel.createMessage(":x: There is no self-assignable role set on this server");
        }
        return context.client.handlers.InteractiveList.createPaginatedMessage({
            channel: context.message.channel,
            userID: context.message.author.id,
            messages: (() => {
                let messages = [];
                for (const role of context.guildEntry.selfAssignableRoles) {
                    const guildRole = context.message.channel.guild.roles.get(role.id);
                    messages.push({
                        embed: {
                            title: "Self-assignable roles list",
                            description: "Here's the list of the self-assignable roles, you can assign one to yourself with `" + context.prefix + "iamnot <role_name>`\n",
                            footer: {
                                text: `Showing page {index}/${context.guildEntry.selfAssignableRoles.length} | Time limit: 60 seconds`
                            },
                            fields: [{
                                name: 'Name',
                                value: `${guildRole.name}`,
                                inline: true
                            }, {
                                name: 'HEX Color',
                                value: `#${this.getHexColor(guildRole.color)} (the borders color of this list are a preview)`,
                                inline: true
                            }, {
                                name: `Hoisted`,
                                value: guildRole.hoist ? `:white_check_mark:` : `:x:`
                            }, {
                                name: 'Mentionable',
                                value: guildRole.mentionable ? `:white_check_mark:` : `:x:`,
                                inline: true
                            }, {
                                name: 'Incompatible roles',
                                value: role.incompatibleRoles[0] ? 'This role cannot be stacked with: ' + context.client.commands.get('uinfo').sliceRoles(role.incompatibleRoles.filter(r => context.message.channel.guild.roles.has(r)).map(r => `<@&${r}>`)) : 'This role can be stacked with all other roles'
                            }],
                            color: guildRole.color
                        }
                    });
                }
                return messages;
            })()
        });
    }

    async removeRole(context) {
        let guildRole = await context.getRoleFromText(context.args.join(' '));
        const member = context.message.channel.guild.members.get(context.message.author.id);
        if (!guildRole || !context.guildEntry.selfAssignableRoles.find(r => r.id === guildRole.id)) {
            return context.message.channel.createMessage(":x: The specified role does not exist or it is not a self-assignable role");
        }
        if (!member.roles.includes(guildRole.id)) {
            return context.message.channel.createMessage(':x: You do not have this role, therefore I can\'t remove it');
        }
        if (this.getHighestRole(context.client.bot.user.id, context.message.channel.guild) && (guildRole.position > this.getHighestRole(context.client.bot.user.id, context.message.channel.guild).position)) {
            return context.message.channel.createMessage(`:x: The role \`${guildRole.name}\` is higher than my highest role, therefore, I can't give/remove it from you :c`);
        }
        await member.removeRole(guildRole.id);
        return context.message.channel.createMessage(":white_check_mark: Alright, I removed from you the role `" + guildRole.name + "`");
    }
}

module.exports = IamNot;