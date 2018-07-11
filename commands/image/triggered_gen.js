'use strict';
const axios = require("axios");
const Command = require('../../util/helpers/modules/Command');

//Written by Ota#1354 the 26/06/2018

class TriggeredGen extends Command {
    constructor() {
        super();
        this.help = {
            name: 'triggered_gen',
            description: 'Generate a triggered image with the avatar of the specified user, or yours if nobody is specified',
            usage: '{prefix}triggered_gen <user_resolvable>',
            category: 'image',
            subCategory: 'image-generation'
        };
        this.conf = {
            requireDB: false,
            disabled: false,
            aliases: ['trig_gen', 'triggeredgen', 'triggen'],
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
        const target = user || client.extendedUser(message.author);
        const image = await axios.get(`https://cute-api.tk/v1/generate/triggered?url=${target.avatarURL || target.defaultCDNAvatar}`, {responseType: 'arraybuffer'});
        return message.channel.createMessage(``, {
            file: image.data,
            name: `${Date.now()}-${message.author.id}.gif`
        });
    }
}

module.exports = new TriggeredGen();
