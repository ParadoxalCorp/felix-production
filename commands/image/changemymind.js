const ImageCommands = require("../../structures/CommandCategories/ImageCommands");

const axios = require("axios").default;

class ChangeMyMind extends ImageCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "changemymind",
                description: "Go on, change my mind!",
                subCategory: "image-generation",
                usage: "{prefix}changemymind <text>"
            },
            conf: {
                aliases: ['cmm', 'changemind']
            }
        }, { noArgs: "You need to specify what to say"});
    }
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run (context) {
        const text = context.args.join(" ");
        if (text.length > 72) {
            return context.message.channel.createMessage("Can you try and change my mind in under 72 characters please");
        }
        const generatedCMM = await axios.get(`https://nekobot.xyz/api/imagegen?type=changemymind&text=${encodeURIComponent(text)}`).catch(() => false);
        if (!generatedCMM) {
            return context.message.channel.createMessage("Oops, seems like nekobot api is down >:|");
        }
        return context.message.channel.createMessage({
            embed: {
                image: {
                    url: generatedCMM.data.message
                },
                color: context.client.config.options.embedColor.generic,
                footer: {
                    text: "Powered by https://docs.nekobot.xyz/"
                }
            }
        });
    }
}

module.exports = ChangeMyMind;