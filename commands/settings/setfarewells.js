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
        this.extra = { possibleActions: this.genericPossibleActions('farewells') };
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
                        value: this.checkChannelPermissions('farewells', context)
                    }
                ],
                color: context.client.config.options.embedColor.generic
            }
        });
    }
}

module.exports = SetFarewells;