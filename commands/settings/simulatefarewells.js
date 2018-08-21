const SettingsCommands = require("../../structures/CommandCategories/SettingsCommands");

class SimulateFarewells extends SettingsCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "simulatefarewells",
                description: "Simulate the farewells with you as the leaving member",
                usage: "{prefix}simulatefarewells"
            },
            conf: {
                requireDB: true,
                guildOnly: true
            }
        });
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async run(context) {
        if (!context.guildEntry.farewells.enabled) {
            return context.message.channel.createMessage(":x: The farewell are not enabled");
        }
        if (!context.guildEntry.farewells.message) {
            return context.message.channel.createMessage(
                ":x: There is no farewell message set"
            );
        }
        if (
            !context.guildEntry.farewells.channel ||
			(context.guildEntry.farewells.channel !== "dm" &&
				!context.message.channel.guild.channels.has(context.guildEntry.farewells.channel))
        ) {
            return context.message.channel.createMessage(
                ":x: The farewell's message target is not set"
            );
        }
        //Backward compatibility, see issue #33 (https://github.com/ParadoxalCorp/felix-production/issues/33)
        if (
            context.message.channel.guild.channels.get(context.guildEntry.farewells.channel).type !==
			0
        ) {
            return context.message.channel.createMessage(
                ":x: The farewell's message target is not a text channel, you should change it to a text channel in order for farewells to work"
            );
        }
        context.client.bot.emit(
            "guildMemberRemove",
            context.message.channel.guild,
            context.message.channel.guild.members.get(context.message.author.id)
        );
        return context.message.channel.createMessage(
            this.client.commands
                .get("setfarewells")
                ._checkPermissions(context)
        );
    }
}

module.exports = SimulateFarewells;
