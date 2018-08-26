const UtilityCommands = require("../../structures/CommandCategories/UtilityCommands");

class Translate extends UtilityCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "translate",
                description: "Translate the provided text to the specified language using google translate",
                usage: '{prefix}translate "hello" en:fr'
            }
        });
    }

    /** @param {import("../../structures/Contexts/UtilityContext")} context */

    async run(context) {
        const googleTranslate = require("google-translate-api");
        context.args = context.args.join(" ").split('"').filter(a => a !== "").map(a => a.trim());
        if (context.args[0] && context.args[0].includes(":") && !new RegExp(/\s+/g).test(context.args[0])) {
            context.args.push(context.args.shift().trim());
        }
        let textToTranslate = context.args[0];
        if (!context.args[1] || !textToTranslate) {
            return context.message.channel.createMessage(`:x: You need to at least specify the text to translate and the language to which i should translate it`);
        }
        let sourceLang = context.args[1].split(":")[0].toLowerCase().trim();
        let targetLang = context.args[1].split(":")[1]
            ? context.args[
                context.args[1].includes('"')
                    ? 0
                    : 1
            ].split(":")[1].toLowerCase().trim()
            : false;
        //If only one language iso is specified, take it as the target
        if (!targetLang) {
            targetLang = sourceLang;
            sourceLang = undefined;
        }
        let translated = await googleTranslate(textToTranslate, {
            from: sourceLang,
            to: targetLang
        }).catch(() => {
            return false;
        });
        if (!translated) {
            return context.message.channel.createMessage(
                `:x: One of the specified language is not supported or the syntax is incorrect, it must be the following syntax: \`${context.message.guild
                    ? context.client.guildData.get(context.message.guild.id).generalSettings.prefix
                    : context.client.config.prefix}translate "text to translate" SOURCE_LANGUAGE_ISO:TARGET_LANGUAGE_ISO\` (see the help for examples)`);
        }
        return context.message.channel.createMessage({
            embed: {
                title: `:white_check_mark: Text translated from ${translated.from.language.iso.toUpperCase()} to ${targetLang.toUpperCase()}\n`,
                description: "```" + translated.text + "```"
            }
        });
    }
}

module.exports = Translate;