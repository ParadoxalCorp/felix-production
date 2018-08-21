const SettingsCommands = require("../../structures/CommandCategories/SettingsCommands");

class SetPrefix extends SettingsCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "setprefix",
                description: "Set a custom prefix for commands, if you want the prefix to not contain a space between the prefix and the command, use `{prefix}setprefix <new_prefix> unspaced` so like `{prefix}setprefix ! unspaced` will make commands look like `!ping`",
                usage: "{prefix}setprefix <new_prefix> <unspaced>"
            },
            conf: {
                aliases: ["prefix"],
                requireDB: true,
                guildOnly: true
            }
        });
    }

    /** @param {import("../../structures/Contexts/SettingsContext")} context */

    async run(context) {
        const spaced = (
            context.args[1]
                ? context.args[1].toLowerCase()
                : context.args[1]) === "unspaced"
            ? false
            : true;
        if (!context.args[0]) {
            return context.message.channel.createMessage(`The current prefix on this server is \`${context.guildEntry.getPrefix}\``);
        }
        if (context.args[0] === `<@${context.client.bot.user.id}>` || context.args[0] === `<@!${context.client.bot.user.id}>`) {
            return context.message.channel.createMessage(`:x: Ahhh yes but no im sorry this prefix cannot be chosen`);
        }
        context.guildEntry.prefix = context.args[0] === context.client.config.prefix && spaced
            ? ""
            : context.args[0];
        context.guildEntry.spacedPrefix = spaced;
        await context.client.handlers.DatabaseWrapper.set(context.guildEntry, "guild");
        return context.message.channel.createMessage(
            `:white_check_mark: Alright, the prefix has successfully been set as a ${spaced
                ? "spaced"
                : "unspaced"} prefix to \`${context.args[0]}\`, commands will now look like \`${context.args[0] + (
                spaced
                    ? " "
                    : "")}ping\``);
    }
}

module.exports = SetPrefix;