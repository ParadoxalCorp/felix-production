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

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        const user = await this.getUserFromText({ message, client, text: args.join(' ') });
        const target = user || new client.structures.ExtendedUser(message.author, client);
        return message.channel.createMessage({
            content: `<:picture:480539891114049549> The avatar of **${target.username}**`,
            embed: {
                color: client.config.embedColor.generic,
                author: {
                    name: `Requested by: ${message.author.username}#${message.author.discriminator}`,
                    icon_url: message.author.avatarURL
                },
                title: `Link to the avatar`,
                url: target.avatarURL || target.defaultCDNAvatar,
                image: {
                    url: target.avatarURL || target.defaultCDNAvatar
                },
                timestamp: new Date(),
                footer: {
                    text: client.bot.user.username,
                    icon_url: client.bot.user.avatarURL
                }
            }
        });
    }
}

module.exports = new Avatar();
