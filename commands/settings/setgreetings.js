const SettingsCommands = require("../../structures/CommandCategories/SettingsCommands");

class SetGreetings extends SettingsCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "setgreetings",
                description: "This command allows you to change the settings of the greetings system",
                usage: "{prefix}setgreetings",
                externalDoc: "https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#greetings-and-farewell-system"
            },
            conf: {
                aliases: ["greetings"],
                requireDB: true,
                guildOnly: true
            }
        });
        this.extra = { possibleActions: this.genericPossibleActions('greetings', true) };
        this.conf.expectedArgs = [
            {
                description: "Please specify the action you want to do in the following possible actions: " + this.extra.possibleActions.map(a => `\`${a.name}\``).join(", "),
                possibleValues: this.extra.possibleActions
            }, {
                //Conditional set_message_target branch
                condition: (client, message, args) => args.includes("set_message_target"),
                description: "Please specify the target of the greetings messages, specify `#<channel_name>` or `<channel_name>` to send them in a specific channel or `dm` to send them directly to the member who just joined",
                possibleValues: [
                    {
                        name: "*",
                        interpretAs: "{value}"
                    }
                ]
            }, {
                //Conditional set_message branch
                condition: (client, message, args) => args.includes("set_message"),
                description: `Please specify the greetings message you want to be sent whenever a new user join the server, check <${this.help.externalDoc}> for more information and a list of tags you can use`
            }
        ];
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async seeSettings(context) {
        return context.message.channel.createMessage({
            embed: {
                title: ":gear: Current greetings settings",
                description: "Greetings message: ```\n" + (
                    context.guildEntry.greetings.message.length > 1950
                        ? context.guildEntry.greetings.message.substr(0, 1950) + "..."
                        : context.guildEntry.greetings.message) + "```",
                fields: [
                    {
                        name: "Greetings",
                        value: context.guildEntry.greetings.enabled
                            ? "Enabled :white_check_mark:"
                            : "Disabled :x:",
                        inline: true
                    }, {
                        name: "Greetings target",
                        value: context.guildEntry.greetings.channel
                            ? context.guildEntry.greetings.channel === "dm"
                                ? "dm"
                                : `<#${context.guildEntry.greetings.channel}>`
                            : "Not set :x:"
                    }, {
                        name: "Permissions",
                        value: this.checkChannelPermissions('greetings', context)
                    }
                ],
                color: context.client.config.options.embedColor.generic
            }
        });
    }
}

module.exports = SetGreetings;