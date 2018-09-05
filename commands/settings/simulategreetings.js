const SettingsCommands = require("../../structures/CommandCategories/SettingsCommands");

class SimulateGreetings extends SettingsCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "simulategreetings",
                description: "Simulate the greetings with you as the new member",
                usage: "{prefix}simulategreetings"
            },
            conf: {
                requireDB: true,
                guildOnly: true
            }
        });
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async run(context) {
        if (!context.guildEntry.greetings.enabled) {
            return context.message.channel.createMessage(":x: The greetings are not enabled");
        }
        if (!context.guildEntry.greetings.message) {
            return context.message.channel.createMessage(
                ":x: There is no greetings message set"
            );
        }
        if (
            !context.guildEntry.greetings.channel ||
			(context.guildEntry.greetings.channel !== "dm" &&
				!context.message.channel.guild.channels.has(context.guildEntry.greetings.channel))
        ) {
            return context.message.channel.createMessage(
                ":x: The greetings's message target is not set"
            );
        }
        //Backward compatibility, see issue #33 (https://github.com/ParadoxalCorp/felix-production/issues/33)
        if (
            context.guildEntry.greetings.channel !== "dm" &&
			context.message.channel.guild.channels.get(context.guildEntry.greetings.channel).type !==
				0
        ) {
            return context.message.channel.createMessage(
                ":x: The greetings's message target is not a text channel, you should change it to a text channel in order for greetings to work"
            );
        }
        context.client.bot.emit(
            "guildMemberAdd",
            context.message.channel.guild,
            context.message.channel.guild.members.get(context.message.author.id)
        );
        return context.message.channel.createMessage(this.checkChannelPermissions('farewells', context));
    }
}

module.exports = SimulateGreetings;
