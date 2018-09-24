const ImageCommands = require("../../structures/CommandCategories/ImageCommands");

const axios = require("axios").default;

class Tweet extends ImageCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "tweet",
                description: "Tweet something",
                subCategory: "image-generation",
                usage: "{prefix}tweet <text>"
            }
        }, { noArgs: "You need to specify what to tweet"});
    }
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run (context) {
        const text = context.args.join(" ");
        if (text.length > 64) {
            return context.message.channel.createMessage("A tweet can't be longer than 64 characters >:|");
        }
        const generatedTweet = await axios.get(`https://nekobot.xyz/api/imagegen?type=tweet&text=${encodeURIComponent(text)}&username=${encodeURIComponent(context.message.author.username)}`).catch(() => false);
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

module.exports = Tweet;