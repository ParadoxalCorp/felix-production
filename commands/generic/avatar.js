'use strict';
//@ts-check

//Written by Ota#1354 the 26/06/2018

const Command = require('../../util/helpers/modules/Command');

class Avatar extends Command {
    constructor() {
        super();
        this.help = {
            name: 'avatar',
            category: 'generic',
            description: 'Display and give a link to the avatar of the specified user, or to yours if nobody is specified',
            usage: '{prefix}avatar <user_resolvable>'
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
        return message.channel.createMessage({
            embed: {
                title: `Link to the avatar of ${target.username}`,
                url: target.avatarURL,
                author: {
                    name: target.tag,
                    icon_url:target.avatarURL
                },
                image: {
                    url: target.avatarURL
                },
                timestamp: new Date(),
                image: {
                    url: target.avatarURL
                },
                color: client.config.options.embedColor
            }
        });
    }
}

module.exports = new Avatar();