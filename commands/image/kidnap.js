const ImageCommands = require("../../structures/CommandCategories/ImageCommands");

const axios = require("axios").default;

class Kidnap extends ImageCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'kidnap',
                description: 'Kidnap a user *sweats*',
                usage: '{prefix}kidnap <url|user_resolvable>',
                subCategory: 'image-generation'
            }
        });
    }
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run(context) {
        const user = await context.getUserFromText(context.args.join(' '));
        const target = user || context.message.author;
        const generatedJPG = await axios.get(`https://nekobot.xyz/api/imagegen?type=kidnap&image=${target.avatarURL || target.defaultCDNAvatar}`).catch(() => false);
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

module.exports = Kidnap;
