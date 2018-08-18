const axios = require("axios");
const GenericCommands = require('../../structures/CommandCategories/ImageCommands');

class TriggeredGen extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'triggered_gen',
                description: 'Generate a triggered image with the avatar of the specified user, or yours if nobody is specified',
                usage: '{prefix}triggered_gen <user_resolvable>',
                subCategory: 'image-generation'
            },
            conf: {
                aliases: ['trig_gen', 'triggeredgen', 'triggen'],
                requirePerms: ['attachFiles'],
                guildOnly: true,
                require: ['weebSH', 'taihou']
            },
        });
    }

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        const user = await this.getUserFromText({ message, client, text: args.join(' ') });
        const target = user || new client.structures.ExtendedUser(message.author, client);
        const image = await axios.get(`https://cute-api.tk/v1/generate/triggered?url=${target.avatarURL || target.defaultCDNAvatar}`, {responseType: 'arraybuffer'});
        return message.channel.createMessage(``, {
            file: image.data,
            name: `${Date.now()}-${message.author.id}.gif`
        });
    }
}

module.exports = new TriggeredGen();
