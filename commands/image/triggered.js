'use strict';
const axios = require("axios");
const Command = require('../../util/helpers/modules/Command');

class triggered extends Command {
    constructor() {
        super();
        this.help = {
            name: 'triggered',
            description: '',
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
        let user = !args[0] ? message.author : await this.getUserFromText({client: client, message: message, text: args.join(' ')});
        if (!user) {
            return message.channel.createMessage(`:x: No members found`);
        }
        const image = await axios.get(`https://cute-api.tk/v1/generate/triggered?url=${user.avatarURL}`, {responseType: 'arraybuffer'});
        return message.channel.createMessage(``, {
            file: image.data,
            name: `${Date.now()}-${message.author.id}.gif`
        });
    }
}

module.exports = new triggered();