const SettingsCommands = require("../../structures/CommandCategories/SettingsCommands");

class SetFarewells extends SettingsCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "setfarewells",
                description: "This command allows you to change the settings of the farewells system",
                usage: "{prefix}setfarewells",
                externalDoc: "https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#greetings-and-farewell-system"
            },
            conf: {
                aliases: ["farewells"],
                requireDB: true,
                guildOnly: true
            }
        });
        this.extra = {
            possibleActions: [
                {
                    name: "enable",
                    func: this.enable.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 0
                }, {
                    name: "disable",
                    func: this.disable.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 0
                }, {
                    name: "set_message",
                    func: this.setMessage.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 1
                }, {
                    name: "set_message_target",
                    func: this.setMessageTarget.bind(this),
                    interpretAs: "{value}",
                    expectedArgs: 1
                }, {
                    name: "see_settings",
                    func: this.seeSettings.bind(this),
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
                //Conditional set_message_target branch
                condition: (client, message, args) => args.includes("set_message_target"),
                description: "Please specify the target of the farewells messages, specify `#<channel_name>` or `<channel_name>` to send them in a specific channel or `dm` to send them directly to the member who just joined",
                possibleValues: [
                    {
                        name: "*",
                        interpretAs: "{value}"
                    }
                ]
            }, {
                //Conditional set_message branch
                condition: (client, message, args) => args.includes("set_message"),
                description: `Please specify the farewells message you want to be sent whenever a new user join the server, check <${this.help.externalDoc}> for more information and a list of tags you can use`
            }
        ];
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

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

    async enable(context) {
        if (!context.guildEntry.farewells.enabled) {
            context.guildEntry.farewells.enabled = true;
            await context.client.handlers.DatabaseWrapper.set(context.guildEntry, "guild");
            return context.message.channel.createMessage(":white_check_mark: Alright, the farewells are now enabled. Make sure to also set up a farewells message and the target");
        } else {
            return context.message.channel.createMessage(":x: The farewells are already enabled");
        }
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async disable(context) {
        if (context.guildEntry.farewells.enabled) {
            context.guildEntry.farewells.enabled = false;
            await context.client.handlers.DatabaseWrapper.set(context.guildEntry, "guild");
            return context.message.channel.createMessage(":white_check_mark: Alright, the farewells are now disabled");
        } else {
            return context.message.channel.createMessage(":x: The farewells are already disabled");
        }
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async setMessageTarget(context) {
        const channel = await context.getChannelFromText(context.args[1]);
        if (!channel) {
            return context.message.channel.createMessage(`:x: I couldn't find a channel named \`${context.args[1]}\` on this server`);
        } else if (context.guildEntry.farewells.channel === channel.id) {
            return context.message.channel.createMessage(`:x: The farewells target is already set to the channel <#${channel.id}>`);
        }
        context.guildEntry.farewells.channel = channel.id;
        await context.client.handlers.DatabaseWrapper.set(context.guildEntry, "guild");
        const hasPerm = Array.isArray(this.clientHasPermissions(context.message, this.client, ["sendMessages"], channel))
            ? false
            : true;
        return context.message.channel.createMessage(`:white_check_mark: Alright, the farewells target has been set to the channel <#${channel.id}>` + (
            !hasPerm
                ? `\n\n:warning: It seems like i don\'t have enough permissions to send messages in <#${channel.id}>, you may want to fix that`
                : ""));
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async setMessage(context) {
        if (!context.args[1]) {
            return context.message.channel.createMessage(":x: You must specify the new farewells message to use");
        }
        context.guildEntry.farewells.message = context.args[2]
            ? context.args.splice(1).join(" ")
            : context.args[1];
        await context.client.handlers.DatabaseWrapper.set(context.guildEntry, "guild");
        return context.message.channel.createMessage(":white_check_mark: Alright, the farewells message has been updated");
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async seeSettings(context) {
        return context.message.channel.createMessage({
            embed: {
                title: ":gear: Current farewells settings",
                description: "farewells message: ```\n" + (
                    context.guildEntry.farewells.message.length > 1950
                        ? context.guildEntry.farewells.message.substr(0, 1950) + "..."
                        : context.guildEntry.farewells.message) + "```",
                fields: [
                    {
                        name: "farewells",
                        value: context.guildEntry.farewells.enabled
                            ? "Enabled :white_check_mark:"
                            : "Disabled :x:",
                        inline: true
                    }, {
                        name: "farewells target",
                        value: context.guildEntry.farewells.channel
                            ? `<#${context.guildEntry.farewells.channel}>`
                            : "Not set :x:"
                    }, {
                        name: "Permissions",
                        value: this._checkPermissions(context)
                    }
                ],
                color: context.client.config.options.embedColor.generic
            }
        });
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    _checkPermissions(context) {
        let result = "";
        const channel = context.message.channel.guild.channels.get(context.guildEntry.farewells.channel);
        if (channel) {
            result += Array.isArray(this.clientHasPermissions(context.message, this.client, ["sendMessages"], channel))
                ? `:warning: I don't have enough permissions to send messages in <#${
                    channel.id}>\n` : "";
        }
        if (!result) {
            result = ":white_check_mark: No permissions issues have been detected with the current settings";
        }
        return result;
    }
}

module.exports = SetFarewells;