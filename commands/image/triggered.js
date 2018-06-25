'use strict';
const axios = require("axios");
const Command = require('../../util/helpers/modules/Command');

class Triggered extends Command {
    constructor() {
        super();
        this.help = {
            name: 'triggered',
            description: 'Generate a triggered image with the avatar of the specified user',
            usage: '{prefix}triggered <user_resolvable>',
            category: 'image',
            subCategory: 'image-generation'
        };
        this.conf = {
            requireDB: false,
            disabled: false,
            aliases: ['trig'],
            requirePerms: ['attachFiles'],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: [],
            require: []
        };
    }
    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        const user = await this.getUserFromText({ message, client, text: args.join(' ') });
        const target = user ? client.extendedUser(user) : client.extendedUser(message.author);
        const member = message.channel.guild.members.get(target.id);
        const image = await axios.get(`https://cute-api.tk/v1/generate/triggered?url=${member.avatarURL}`, {responseType: 'arraybuffer'});
        return message.channel.createMessage(``, {
            file: image.data,
            name: `${Date.now()}-${message.author.id}.gif`
        });
    }
}

module.exports = new Triggered();