'use strict';
//@ts-check

const Command = require('../../util/helpers/modules/Command');

class Avatar extends Command {
    constructor() {
        super();
        this.help = {
            name: 'avatar',
            category: 'generic',
            description: 'Show your avatar or that of a users',
            usage: '{prefix}avatar'
        };
        this.conf = {
            requireDB: false,
            disabled: false,
            aliases: [],
            requirePerms: [],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: []
        };
    }
    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        const user = await this.getUserFromText({ message, client, text: args.join(' ') });
        const target = user ? client.extendedUser(user) : client.extendedUser(message.author);
        const member = message.channel.guild.members.get(target.id);
        return message.channel.createMessage({
            embed: {
                title: `Link of the avatar of ${member.username}`,
                url: member.avatarURL,
                author: {
                    name: message.author.tag,
                    icon_url: message.author.avatarURL
                },
                image: {
                    url: member.avatarURL
                },
                timestamp: new Date(),
                image: {
                    url: member.avatarURL
                },
                color: client.config.options.embedColor
            }
        });
    }
}

module.exports = new Avatar();