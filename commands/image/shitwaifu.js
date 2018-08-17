'use strict';

const GenericCommands = require('../../structures/CommandCategories/ImageCommands');

class ShitWaifu extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'shitwaifu',
                description: 'Uh well, I think the name is pretty self-explanatory',
                usage: '{prefix}shitwaifu <user_resolvable>',
                subCategory: 'image-generation'
            },
            conf: {
                requirePerms: ['attachFiles'],
                guildOnly: true,
                require: ['weebSH', 'taihou']
            },
        });
    }

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        const user = args[0] ? await this.getUserFromText({client: client, message: message, text: args[0]}).then(u => u || new client.structures.ExtendedUser(message.author, client)) : (new client.structures.ExtendedUser(message.author, client));
        let typing = false;
        //If the queue contains 2 items or more, expect that this request will take some seconds and send typing to let the user know
        if (client.weebSH.korra.requestHandler.queue.length >= 2) {
            client.bot.sendChannelTyping(message.channel.id);
            typing = true;
        }
        const generatedInsult = await client.weebSH.korra.generateWaifuInsult(this.useWebpFormat(user)).catch(this.handleError.bind(this, client, message, typing));
        return message.channel.createMessage(typing ? `<@!${message.author.id}> ` : '', {file: generatedInsult, name: `${Date.now()}-${message.author.id}.png`});
    }

    handleError(client, message, typing, error) {
        if (typing) {
            client.bot.sendChannelTyping(message.channel.id);
        }
        throw error;
    }

    useWebpFormat(user) {
        return user.avatarURL ? user.avatarURL.replace(/.jpeg|.jpg|.png|.gif/g, '.webp') : user.defaultCDNAvatar;
    }
}

module.exports = new ShitWaifu();