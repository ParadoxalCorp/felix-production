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
        this.conf.expectedArgs = [
            {
                description: "Please specify the action you want to do in the following possible actions: " + this.extra.possibleActions.map(a => `\`${a.name}\``).join(", "),
                possibleValues: this.extra.possibleActions
            }, {
                //Conditional add_role branch
                condition: (client, message, args) => args.includes("add_role"),
                description: "Please specify the name of the role to add"
            }, {
                //Conditional remove_role branch
                condition: (client, message, args) => args.includes("remove_role"),
                description: "Please specify the name of the role set to be given to new members to remove"
            }
        ];
    }

    /** @param {import("../../structures/Contexts/ModerationContext")} context */


    async run(context) {
        const action = this.extra.possibleActions.find(a => a.name === context.args[0]);
        const getPrefix = this.client.commands.get("help").getPrefix;
        if (!action) {
            return context.message.channel.createMessage(`:x: The specified action is invalid, if you are lost, simply run the command like \`${getPrefix(context.client, context.guildEntry)}${this.help.name}\``);
        }
        //If the command isn't ran without args and the args aren't what's expected, to not conflict with the skipping in conditions
        if (action.expectedArgs > context.args.length - 1) {
            return context.message.channel.createMessage(`:x: This action expect \`${action.expectedArgs - (context.args.length - 1)}\` more argument(s), if you are lost, simply run the command like \`${getPrefix(context.client, context.guildEntry)}${this.help.name}\``);
        }
        return action.func(context);
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
        await context.client.handlers.DatabaseWrapper.set(context.guildEntry, "guild");
        let warning = "";
        const hasPerm = Array.isArray(this.clientHasPermissions(context.message, this.client, ["manageRoles"]))
            ? false
            : true;
        if (!hasPerm || role.position > this.getHighestRole(context.client.bot.user.id, context.message.channel.guild).position) {
            warning += ":warning: ";
            warning += !hasPerm
                ? "I lack the `Manage Roles` permission"
                : "";
            warning += (
                !hasPerm
                    ? " and "
                    : "") + "this role is higher than my highest role";
            warning += ". I therefore won't be able to give it when the time comes, you should fix that as soon as possible or remove the role";
        }
        return context.message.channel.createMessage(`:white_check_mark: Successfully set the role \`${role.name}\` to be given to new members` + (
            warning
                ? `\n\n${warning}`
                : ""));
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

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    _checkPermissions(context) {
        let result = "";
        const channel = context.message.channel.guild.channels.get(context.guildEntry.experience.notifications.channel);
        if (channel) {
            result += Array.isArray(this.clientHasPermissions(context.message, this.client, ["sendMessages"], channel))
                ? `:warning: I don't have enough permissions to send messages in <#${
                    channel.id}>\n` : "";
        }
        if (Array.isArray(this.clientHasPermissions(context.message, this.client, ["manageRoles"])) && context.guildEntry.experience.roles[0]) {
            result += ":warning: I don't have the `Manage Roles` permission and there are roles set to be given\n";
        }
        context.guildEntry.experience.roles = context.guildEntry.experience.roles.filter(r => context.message.channel.guild.roles.has(r.id));
        const higherRoles = context.guildEntry.experience.roles.filter(r => context.message.channel.guild.roles.get(r.id).position > this.getHighestRole(context.client.bot.user.id, context.message.channel.guild).position);
        if (higherRoles[0]) {
            result += ":warning: The role(s) " + higherRoles.map(r => `\`${context.message.channel.guild.roles.get(r.id).name}\``).join(", ") + " is/are set to be given at some point, however it is/they are higher than my highest role and i therefore can't give them";
        }
        if (!result) {
            result = ":white_check_mark: No permissions issues have been detected with the current settings";
        }
        return result;
    }
}

module.exports = OnJoinRoles;