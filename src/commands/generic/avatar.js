const Command = require("../../structures/Command");

module.exports = class Avatar extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            const user = await ctx.fetchUser(ctx.args.target)
            const target = user || ctx.msg.author;
            
            return ctx.msg.channel.createMessage({
                embed: ctx.genericEmbed({
                    author: {
                        name: `Requested by: ${ctx.msg.author.username}#${ctx.msg.author.discriminator}`,
                        icon_url: ctx.msg.author.avatarURL
                    },
                    title: `Link to the avatar`,
                    url: target.avatarURL.replace("size=128", "size=512") || target.defaultAvatarURL,
                    image: {
                        url: target.avatarURL.replace("size=128", "size=512") || target.defaultAvatarURL
                    }
                })
            })
        });
        this.setName("avatar")
            .setDescription("Shows the avatar of the user")
            .setExpectedArgs("target:(user_resolvable)*")
    }
};