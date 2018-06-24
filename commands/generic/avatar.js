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
        let user = !args[0] ? message.author : await this.getUserFromText({client: client, message: message, text: args.join(' ')});
        if (!user) {
            return message.channel.createMessage(`:x: No members found`);
        }
        return message.channel.createMessage({
            embed: {
                author: {
                    name: user.tag,
                    icon_url: user.avatarURL
                },
                image: {
                    url: user.avatarURL
                },
                timestamp: new Date(),
                image: {
                    url: user.avatarURL
                },
                color: client.config.options.embedColor
            }
        });
    }
}

module.exports = new Avatar();