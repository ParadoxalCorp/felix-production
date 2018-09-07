const SettingsCommands = require("../../structures/CommandCategories/SettingsCommands");

class OnJoinRoles extends SettingsCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "onjoinroles",
                description: "This command allows you to set roles to give to each new member, each roles added will be given to the new members of the server right when they join",
                usage: "{prefix}onjoinroles"
            },
            conf: {
                aliases: ["defaultroles"],
                requireDB: true,
                guildOnly: true
            }
        });
        this.extra = {
            possibleActions: [
                {
                    name: "add_role",
                    func: this.addRole.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 1
                }, {
                    name: "remove_role",
                    func: this.removeRole.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 1
                }, {
                    name: "list_roles",
                    func: this.listRoles.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 0
                }
            ]
        };
        this.conf.expectedArgs = this.genericExpectedArgs([{
            //Conditional add_role branch
            condition: (client, message, args) => args.includes("add_role"),
            description: "Please specify the name of the role to add"
        }, {
            //Conditional remove_role branch
            condition: (client, message, args) => args.includes("remove_role"),
            description: "Please specify the name of the role set to be given to new members to remove"
        }]);
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async addRole(context) {
        const roleName = context.args.splice(1).join(" ");
        const role = await context.getRoleFromText(roleName);
        const alreadySet = role
            ? context.guildEntry.onJoinRoles.includes(role.id)
            : false;
        context.guildEntry.onJoinRoles = context.guildEntry.onJoinRoles.filter(r => context.message.channel.guild.roles.has(r));
        if (!role) {
            return context.message.channel.createMessage(`:x: I couldn't find the role \`${roleName}\` in this server`);
        } else if (alreadySet) {
            return context.message.channel.createMessage(`:x: The role \`${role.name}\` is already set to be given to new members`);
        } else if (context.guildEntry.onJoinRoles.length >= context.client.config.options.maxDefaultRoles) {
            return context.message.channel.createMessage(`:x: There is already \`${context.guildEntry.onJoinRoles.length}\` roles set to be given to new members, you can't add any more than that`);
        }
        context.guildEntry.onJoinRoles.push(role.id);
        await context.guildEntry.save();
        const warning = this.checkRolePermissions('ojr', context);
        return context.message.channel.createMessage(`:white_check_mark: Successfully set the role \`${role.name}\` to be given to new members\n\n${warning}`);
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async removeRole(context) {
        const roleName = context.args.splice(1).join(" ");
        const role = await context.getRoleFromText(roleName);
        context.guildEntry.onJoinRoles = context.guildEntry.onJoinRoles.filter(r => context.message.channel.guild.roles.has(r));
        const isSet = role
            ? context.guildEntry.onJoinRoles.includes(role.id)
            : false;
        if (!role) {
            return context.message.channel.createMessage(`:x: I couldn't find the role \`${roleName}\` in this server`);
        } else if (!isSet) {
            return context.message.channel.createMessage(`:x: This role isn't set to be given to new members, therefore, i can't remove it`);
        }
        context.guildEntry.onJoinRoles.splice(context.guildEntry.onJoinRoles.findIndex(r => r === role.id), 1);
        await context.client.handlers.DatabaseWrapper.set(context.guildEntry, "guild");
        return context.message.channel.createMessage(`:white_check_mark: Successfully removed the role \`${role.name}\``);
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async listRoles(context) {
        context.guildEntry.onJoinRoles = context.guildEntry.onJoinRoles.filter(r => context.message.channel.guild.roles.has(r));
        if (!context.guildEntry.onJoinRoles[0]) {
            return context.message.channel.createMessage(":x: There is no role(s) set to be given to new members");
        }
        return context.client.handlers.InteractiveList.createPaginatedMessage({
            channel: context.message.channel,
            userID: context.message.author.id,
            messages: context.guildEntry.onJoinRoles.map(r => {
                const guildRole = context.message.channel.guild.roles.get(r);
                return {
                    embed: {
                        title: "On join roles list",
                        fields: [
                            {
                                name: "Name",
                                value: guildRole.name,
                                inline: true
                            }, {
                                name: "Color",
                                value: `#${this.getHexColor(guildRole.color)} (The borders colors of this list are a preview`
                            }
                        ],
                        footer: {
                            text: `Showing page {index}/${context.guildEntry.onJoinRoles.length}`
                        },
                        color: guildRole.color
                            ? guildRole.color
                            : undefined
                    }
                };
            })
        });
    }
}

module.exports = OnJoinRoles;