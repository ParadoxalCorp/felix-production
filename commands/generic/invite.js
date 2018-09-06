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
            embed: this.genericEmbed({
                author: {
                    name: `Requested by: ${context.message.author.username}#${context.message.author.discriminator}`,
                    icon_url: context.message.author.avatarURL
                },
                description: `[Invitation link](https://discordapp.com/oauth2/authorize?&client_id=${context.client.bot.user.id}&scope=bot&permissions=2146950271)\n\nIf you aren't sure about what permissions to give, [you should definitely read this](https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md)`,
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
                }]
            })
        });
    }
}

module.exports = Invite;
