const Command = require("../../structures/Command");

module.exports = class Sinfo extends Command {
    constructor(client) {
        super(client, async(ctx) => {

            const embedFields = [{
              name: 'Name',
              value: ctx.guild.name,
              inline: true
          },{
              name: 'Owner',
              value: `<@!${ctx.guild.ownerID}>`,
              inline: true
          },{
              name: 'Region',
              value: ctx.guild.region,
              inline: true
          },{
              name: 'Shard',
              value: ctx.guild.shard.id.toString(),
              inline: true
            },{
              name: 'Created the',
              value: ctx.client.utils.toHumanDate(ctx.guild.createdAt),
              inline: true
          },{
              name: 'I\'m here since the',
              value: ctx.client.utils.toHumanDate(ctx.guild.joinedAt),
              inline: true
          },{
              name: 'Members',
              value: `Users: ${ctx.guild.members.filter(m => !m.user.bot).length}\nBots: ${ctx.guild.members.filter(m => m.user.bot).length}`,
              inline: true
          },{
              name: 'Channels',
              value: `Texts: ${ctx.guild.channels.filter(c => c.type === 0).length}\nVoices: ${ctx.guild.channels.filter(c => c.type === 2).length}`,
              inline: true
          },{
              name: 'Roles',
              value: ctx.guild.roles.size.toString(),
              inline: true
          },{
              name: '2FA',
              value: ctx.guild.mfaLevel === 0 ? `:x:` : `:white_check_mark:`,
              inline: true
          },{
              name: 'Latest members',
              value: Array.from(ctx.guild.members.values()).sort((a, b) => b.joinedAt - a.joinedAt).map(m => `\`${m.username}#${m.discriminator}\``).splice(0, 5).join(` **>** `)
          }];
            
            return ctx.msg.channel.createMessage({
                content: `${ctx.guild.name}'s info`,
                embed: ctx.genericEmbed({
                    author: {
                        name: `Requested by: ${ctx.msg.author.username}#${ctx.msg.author.discriminator}`,
                        icon_url: ctx.msg.author.avatarURL
                    },
                    thumbnail: {
                        url: ctx.guild.iconURL ? ctx.guild.iconURL : 'https://cdn.discordapp.com/attachments/480710816136560651/480710970243547144/defautIcon.png'
                    },
                    fields: embedFields
                })
            })
        });
        this.setName("sinfo")
            .setDescription("Display some ~~useless~~ info about this server");
    }
};