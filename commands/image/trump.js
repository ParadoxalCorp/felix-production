const ImageCommands = require("../../structures/CommandCategories/ImageCommands");

const axios = require("axios").default;

class Trump extends ImageCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "trump",
                description: "Tweet as trump",
                subCategory: "image-generation",
                usage: "{prefix}trump <text>"
            }
        }, { noArgs: "You need to specify what to tweet"});
    }
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run (context) {
        const text = context.args.join(" ");
        if (text.length > 64) {
            return context.message.channel.createMessage("No more than 64 characters please");
        }
        const generatedTweet = await axios.get(`https://nekobot.xyz/api/imagegen?type=trumptweet&text=${encodeURIComponent(text)}`).catch(() => false);
        if (!generatedTweet) {
            return context.message.channel.createMessage("Oops, seems like nekobot api is down >:|");
        }
        return context.message.channel.createMessage({
            embed: {
                image: {
                    url: generatedTweet.data.message
                },
                color: context.client.config.options.embedColor.generic,
                footer: {
                    text: "Powered by https://docs.nekobot.xyz/"
                }
            }
        });
    }
}

module.exports = Trump;