const ImageCommands = require("../../structures/CommandCategories/ImageCommands");

const axios = require("axios").default;

class Captcha extends ImageCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'jpeg',
                description: 'Create a nice JPEG-ified picture',
                usage: '{prefix}captcha <string> | <user_resolvable>',
                subCategory: 'image-generation'
            }
        });
    }
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run(context) {
        const url = context.args.join(' ').replace(/[<>]/g, '').match(/^https?:\/\/.+\.(?:jpg|jpeg|gif|png)$/i);
        const user = await context.getUserFromText(context.args.join(' '));
        const target = user || context.message.author;
        const generatedCaptcha = await axios.get(`https://nekobot.xyz/api/imagegen?type=jpeg&url=${url ? url[0] : (target.avatarURL || target.defaultCDNAvatar)}`).catch(() => false);
        if (!generatedCaptcha) {
            return context.message.channel.createMessage("Oops, seems like nekobot api is down >:|");
        }
        return context.message.channel.createMessage({
            embed: {
                image: {
                    url: generatedCaptcha.data.message
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
