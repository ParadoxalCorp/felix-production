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
            embed: {
                title: `Link to the avatar of ${target.username}`,
                url: target.avatarURL || target.defaultCDNAvatar,
                author: {
                    name: target.tag,
                    icon_url: target.avatarURL || target.defaultCDNAvatar
                },
                image: {
                    url: target.avatarURL || target.defaultCDNAvatar
                },
                timestamp: new Date(),
                color: client.config.options.embedColor
            }
        });
    }
}

module.exports = new Avatar();