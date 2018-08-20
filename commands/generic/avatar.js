const GenericCommands = require('../../structures/CommandCategories/GenericCommands');

class Avatar extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'avatar',
                description: 'Display and give a link to the avatar of the specified user, or to yours if nobody is specified',
                usage: '{prefix}avatar <user_resolvable>',
            },
            conf: {
                guildOnly: true
            }
        });
    }
    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        const user = await this.getUserFromText({ message: context.message, client: context.client, text: context.args.join(' ') });
        const target = user || context.message.author;
        return context.message.channel.createMessage({
            content: `${context.emote('picture')} The avatar of **${target.username}**`,
            embed: {
                color: context.client.config.options.embedColor.generic,
                author: {
                    name: `Requested by: ${context.message.author.username}#${context.message.author.discriminator}`,
                    icon_url: context.message.author.avatarURL
                },
                title: `Link to the avatar`,
                url: target.avatarURL || target.defaultCDNAvatar,
                image: {
                    url: target.avatarURL || target.defaultCDNAvatar
                },
                timestamp: new Date(),
                footer: {
                    text: context.client.bot.user.username,
                    icon_url: context.client.bot.user.avatarURL
                }
            }
        });
    }
}

module.exports = Avatar;
