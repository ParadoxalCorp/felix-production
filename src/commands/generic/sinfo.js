const Command = require("../../structures/Command");

module.exports = class Sinfo extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            const user = await ctx.fetchUser()
            const target = user || ctx.msg.author;

            const TimeOptions = {  
              day: "numeric", year: "numeric", month: "long",
              hour: "2-digit", minute: "2-digit"  
            };

            const embedFields = [{
              name: 'Name',
              value: ctx.msg.channel.guild.name,
              inline: true
          },{
              name: 'Owner',
              value: `<@!${ctx.msg.channel.guild.ownerID}>`,
              inline: true
          },{
              name: 'Region',
              value: ctx.msg.channel.guild.region,
              inline: true
          },{
              name: 'Shard',
              value: ctx.msg.channel.guild.shard.id,
              inline: true
            },{
              name: 'Created the',
              value: new Date(ctx.msg.channel.guild.createdAt).toLocaleTimeString("en-us", TimeOptions),
              inline: true
          },{
              name: 'I\'m here since the',
              value: new Date(ctx.msg.channel.guild.joinedAt).toLocaleTimeString("en-us", TimeOptions),
              inline: true
          },{
              name: 'Members',
              value: `Users: ${ctx.msg.channel.guild.members.filter(m => !m.user.bot).length}\nBots: ${ctx.msg.channel.guild.members.filter(m => m.user.bot).length}`,
              inline: true
          },{
              name: 'Channels',
              value: `Texts: ${ctx.msg.channel.guild.channels.filter(c => c.type === 0).length}\nVoices: ${ctx.msg.channel.guild.channels.filter(c => c.type === 2).length}`,
              inline: true
          },{
              name: 'Roles',
              value: ctx.msg.channel.guild.roles.size,
              inline: true
          },{
              name: '2FA',
              value: ctx.msg.channel.guild.mfaLevel === 0 ? `:x:` : `:white_check_mark:`,
              inline: true
          },{
              name: 'Latest members',
              value: Array.from(ctx.msg.channel.guild.members.values()).sort((a, b) => b.joinedAt - a.joinedAt).map(m => `\`${m.username}#${m.discriminator}\``).splice(0, 5).join(` **>** `)
          }];
            
            return ctx.msg.channel.createMessage({
                content: `${ctx.msg.channel.guild.name}'s info`,
                embed: ctx.genericEmbed({
                    author: {
                        name: `Requested by: ${ctx.msg.author.username}#${ctx.msg.author.discriminator}`,
                        icon_url: ctx.msg.author.avatarURL
                    },
                    thumbnail: {
                        url: ctx.msg.channel.guild.iconURL ? ctx.msg.channel.guild.iconURL : 'https://cdn.discordapp.com/attachments/480710816136560651/480710970243547144/defautIcon.png'
                    },
                    fields: embedFields
                })
            })
        });
        this.setName("sinfo")
            .setDescription("Display some ~~useless~~ info about this server");
    }
};