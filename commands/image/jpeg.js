const ImageCommands = require("../../structures/CommandCategories/ImageCommands");

const axios = require("axios").default;

class JPEG extends ImageCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'jpeg',
                description: 'Create a nice JPEG-ified picture',
                usage: '{prefix}captcha <string> | <user_resolvable>',
                subCategory: 'image-generation'
            },
            conf: {
                aliases: ['jpg', 'corrupt']
            }
        });
    }
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run(context) {
        const url = context.args.join(' ').replace(/[<>]/g, '').match(/^https?:\/\/.+\.(?:jpg|jpeg|gif|png)$/i);
        const user = await context.getUserFromText(context.args.join(' '));
        const target = user || context.message.author;
        const generatedJPG = await axios.get(`https://nekobot.xyz/api/imagegen?type=jpeg&url=${url ? url[0] : (target.avatarURL || target.defaultCDNAvatar)}`).catch(() => false);
        if (!generatedJPG) {
            return context.message.channel.createMessage("Oops, seems like nekobot api is down >:|");
        }
        return context.message.channel.createMessage({
            embed: {
                image: {
                    url: generatedJPG.data.message
                },
                color: context.client.config.options.embedColor.generic,
                footer: {
                    text: "Powered by https://docs.nekobot.xyz/"
                }
            }
        });
    }
}

module.exports = JPEG;
