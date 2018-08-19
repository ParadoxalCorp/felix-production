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
      message.channel.createMessage({
          content: `Here's my invite link :wave:`,
          embed: {
            color: client.config.embedColor.generic,
            author: {
              name: `Requested by: ${message.author.username}#${message.author.discriminator}`,
              icon_url: message.author.avatarURL
            },
            description: `[Invitation link](https://discordapp.com/oauth2/authorize?&client_id=${client.bot.user.id}&scope=bot&permissions=2146950271)\n**Please remember that I might not work perfectly if I dont have all permissions~**`,
            thumbnail: {
              url: client.bot.user.avatarURL
            },
            fields: [{
              name: "Servers/Guilds",
              value: client.bot.guilds.size,
              inline: true
            },{
              name: "Users/Members",
              value: client.bot.users.size,
              inline: true
            }],
            timestamp: new Date(),
            footer: {
                text: client.bot.user.username,
                icon_url: client.bot.user.avatarURL
            }
          }
      });
    }
}

module.exports = new Invite();
