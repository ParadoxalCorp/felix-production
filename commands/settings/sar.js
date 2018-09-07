const SettingsCommands = require("../../structures/CommandCategories/SettingsCommands");

class Sar extends SettingsCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "sar",
                description:
					"This command allows you to manage self-assignable roles on this server\nTo update the list of roles with which a self-assignable role can't be stacked, just use the command like you are setting a new self-assignable role, it will update the roles according to what you specify",
                usage: "{prefix}sar"
            },
            conf: {
                aliases: ["activity"],
                guildOnly: true,
                requireDB: true
            }
        });
        this.extra = {
            possibleActions: [
                {
                    name: "add",
                    func: this.add.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 1
                },
                {
                    name: "remove",
                    func: this.remove.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 1
                },
                {
                    name: "list",
                    func: this.listRoles.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 0
                }
            ]
        };
        this.conf.expectedArgs = [
            {
                description:
					"Please specify the action you want to do in the following possible actions: " +
					this.extra.possibleActions.map(a => `\`${a.name}\``).join(", "),
                possibleValues: this.extra.possibleActions
            },
            {
                //Conditional add branch
                condition: (client, message, args) => args.includes("add"),
                description:
					"Please specify the name of the role to make self-assignable"
            },
            {
                condition: (client, message, args) => args.includes("add"),
                description:
					"Can this role be stacked with all other roles? If not, answer with a list of roles separated by `;` with which this role can't be stacked with, otherwise just answer `yes`\nYou can learn more about this here <https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#incompatible-roles>"
            },
            {
                //Conditional remove branch
                condition: (client, message, args) => args.includes("remove"),
                description:
					"Please specify the name of the self-assignable role to remove"
            }
        ];
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async add(context) {
        const role = typeof context.args[1] === "string" ? await context.getRoleFromText(context.args[1]) : context.args[1];						    	    
        const alreadySet = role
            ? context.guildEntry.selfAssignableRoles.find(r => r.id === role.id)
            : false;
        const incompatibleRoles =
			context.args[2] && context.args[2].toLowerCase() !== "yes"
			    ? context.args[3]
			        ? context.args
			            .slice(2)
			            .join("")
			            .split(";")
			        : context.args[2].split(";")
			    : false;
        let resolvedRoles = [];
        if (incompatibleRoles && incompatibleRoles[0]) {
            for (const incompatibleRole of incompatibleRoles) {
                const resolved = await context.getRoleFromText(incompatibleRole);
                if (!resolved) {
                    return context.message.channel.createMessage(
                        `:x: I could not find the role \`${incompatibleRole}\``
                    );
                }
                resolvedRoles.push(resolved.id);
            }
        }
        if (!role) {
            return context.message.channel.createMessage(`:x: I couldn't find the role \`${context.args[1]}\` in this server`);
        } else if (alreadySet) {
            context.guildEntry.selfAssignableRoles.find(r => r.id === role.id).incompatibleRoles = resolvedRoles;    
            await context.guildEntry.save();
            return context.message.channel.createMessage(`:white_check_mark: Successfully updated the roles with which \`${role.name}\` can't be stacked`);
        }
        context.guildEntry.selfAssignableRoles.push(
            context.client.structures.References.selfAssignableRole(
                role.id,
                resolvedRoles
            )
        );
        await context.guildEntry.save();
        const warning = this.checkRolePermissions('selfAssignableRoles', context);
        return context.message.channel.createMessage(`:white_check_mark: Successfully set the role \`${role.name}\` as a self-assignable role \n\n${warning}`);
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async remove(context) {
        const role = await context.getRoleFromText(context.args[1]);
        const isSet = role ? context.guildEntry.selfAssignableRoles.find(r => r.id === role.id) : false;  
        if (!role) {
            return context.message.channel.createMessage(`:x: I couldn't find the role \`${context.args[1]}\` in this server`);
        } else if (!isSet) {
            return context.message.channel.createMessage(`:x: This role isn't set as self-assignable`);                        
        }
        context.guildEntry.selfAssignableRoles.splice(
            context.guildEntry.selfAssignableRoles.findIndex(r => r === role.id),
            1
        );
        await context.client.handlers.DatabaseWrapper.set(
            context.guildEntry,
            "guild"
        );
        return context.message.channel.createMessage(
            `:white_check_mark: Successfully removed the role \`${role.name}\``
        );
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async listRoles(context) {
        if (!context.guildEntry.selfAssignableRoles[0]) {
            return context.message.channel.createMessage(
                ":x: There is no role(s) set as self-assignable"
            );
        }
        return context.client.handlers.InteractiveList.createPaginatedMessage({
            channel: context.message.channel,
            userID: context.message.author.id,
            messages: context.guildEntry.selfAssignableRoles.map(r => {
                const guildRole = context.message.channel.guild.roles.get(r.id);
                return {
                    embed: {
                        title: "Activity roles list",
                        fields: [
                            {
                                name: "Name",
                                value: guildRole.name,
                                inline: true
                            },
                            {
                                name: "Mentionable",
                                value: guildRole.mentionable ? ":white_check_mark:" : ":x:",
                                inline: true
                            },
                            {
                                name: "Hoisted",
                                value: guildRole.hoist ? ":white_check_mark:" : ":x:"
                            },
                            {
                                name: "Color",
                                value: `#${this.getHexColor(
                                    guildRole.color
                                )} (the borders colors of this list are a preview)`,
                                inline: true
                            },
                            {
                                name: "Incompatible roles",
                                value: r.incompatibleRoles[0]
                                    ? "This role cannot be stacked with: " +
									  context.client.commands
									      .get("uinfo")
									      .sliceRoles(
									          r.incompatibleRoles
									              .filter(role =>
									                  context.message.channel.guild.roles.has(role)
									              )
									              .map(role => `<@&${role}>`)
									      )
                                    : "This role can be stacked with all other roles"
                            }
                        ],
                        footer: {
                            text: `Showing page {index}/${
                                context.guildEntry.selfAssignableRoles.length
                            }`
                        },
                        color: guildRole.color
                    }
                };
            })
        });
    }
}

module.exports = Sar;
