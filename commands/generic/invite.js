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
    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        context.message.channel.createMessage({
            content: `Here's my invite link :wave:`,
            embed: {
                color: context.client.config.options.embedColor.generic,
                author: {
                    name: `Requested by: ${context.message.author.username}#${context.message.author.discriminator}`,
                    icon_url: context.message.author.avatarURL
                },
                description: `[Invitation link](https://discordapp.com/oauth2/authorize?&client_id=${context.client.bot.user.id}&scope=bot&permissions=2146950271)\n**Please remember that I might not work perfectly if I dont have all permissions~**`,
                thumbnail: {
                    url: context.client.bot.user.avatarURL
                },
                fields: [{
                    name: "Servers/Guilds",
                    value: context.client.bot.guilds.size,
                    inline: true
                },{
                    name: "Users/Members",
                    value: context.client.bot.users.size,
                    inline: true
                }],
                timestamp: new Date(),
                footer: {
                    text: context.client.bot.user.username,
                    icon_url: context.client.bot.user.avatarURL
                }
            }
        });
    }
}

module.exports = Invite;
