const ImageCommands = require("../../structures/CommandCategories/ImageCommands");

const axios = require("axios").default;

class Captcha extends ImageCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'captcha',
                description: 'Generate a nice captcha photo with someone\'s avatar on it',
                usage: '{prefix}captcha <user_resolvable>',
                subCategory: 'image-generation'
            }
        });
    }
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run(context) {
        const user = await context.getUserFromText(context.args.join(' '));
        const target = user || context.message.author;
        const generatedTweet = await axios.get(`https://nekobot.xyz/api/imagegen?type=captcha&url=${target.avatarURL || target.defaultCDNAvatar}&username=${target.username}`).catch(() => false);
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

module.exports = Captcha;
