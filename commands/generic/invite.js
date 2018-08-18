const GenericCommands = require('../../structures/CommandCategories/GenericCommands');

class Invite extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'invite',
                description: 'Get Felix\'s invite link',
                usage: '{prefix}invite',
            }
        });
    }


    async run(client, message) {
        message.channel.createMessage(`Here's my invite link :wave: <https://discordapp.com/oauth2/authorize?&client_id=${client.bot.user.id}&scope=bot&permissions=2146950271> \nPlease remember that I might not work perfectly if I dont have all permissions~`);
    }
}

module.exports = new Invite();