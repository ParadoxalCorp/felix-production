const Command = require("../../structures/Command");

module.exports = class Invite extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            return ctx.msg.channel.createMessage({
                content: `Here's my invite link :wave:`,
                embed: ctx.genericEmbed({
                    author: {
                        name: `Requested by: ${ctx.msg.author.username}#${ctx.msg.author.discriminator}`,
                        icon_url: ctx.msg.author.avatarURL
                    },
                    description: `[Invitation link](https://discordapp.com/oauth2/authorize?&client_id=${ctx.client.user.id}&scope=bot&permissions=2146950271)
                    Please remember that I might not work perfectly if I dont have all permissions`,
                    thumbnail: {
                        url: ctx.client.user.avatarURL
                    },
                    fields: [{
                        name: "Servers/Guilds",
                        value: ctx.client.guilds.size.toString(),
                        inline: true
                    },{
                        name: "Users/Members",
                        value: ctx.client.users.size.toString(),
                        inline: true
                    }]
                })
              })
            })
        this.setName("invite")
            .setDescription("Get Felix's invite link");
    }
};



