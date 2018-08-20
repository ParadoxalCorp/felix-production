const TimeConverter = require(`../../utils/TimeConverter`);
const GenericCommands = require('../../structures/CommandCategories/GenericCommands');

class Sinfo extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'sinfo',
                description: 'Display some ~~useless~~ info about this server',
                usage: '{prefix}sinfo'
            },
            config: {
                aliases: ["serverinfo"],
                guildOnly: true
            }
        });
    }
    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        const embedFields = [{
            name: 'Name',
            value: context.message.channel.guild.name,
            inline: true
        },{
            name: 'Owner',
            value: `<@!${context.message.channel.guild.ownerID}>`,
            inline: true
        },{
            name: 'Region',
            value: context.message.channel.guild.region,
            inline: true
        },{
            name: 'Shard',
            value: context.message.channel.guild.shard.id,
            inline: true
        },{
            name: 'Created the',
            value: TimeConverter.toHumanDate(context.message.channel.guild.createdAt, true),
            inline: true
        },{
            name: 'I\'m here since the',
            value: TimeConverter.toHumanDate(context.message.channel.guild.joinedAt, true),
            inline: true
        },{
            name: 'Members',
            value: `Users: ${context.message.channel.guild.members.filter(m => !m.user.bot).length}\nBots: ${context.message.channel.guild.members.filter(m => m.user.bot).length}`,
            inline: true
        },{
            name: 'Channels',
            value: `Texts: ${context.message.channel.guild.channels.filter(c => c.type === 0).length}\nVoices: ${context.message.channel.guild.channels.filter(c => c.type === 2).length}`,
            inline: true
        },{
            name: 'Roles',
            value: context.message.channel.guild.roles.size,
            inline: true
        },{
            name: '2FA',
            value: context.message.channel.guild.mfaLevel === 0 ? `:x:` : `:white_check_mark:`,
            inline: true
        },{
            name: 'Latest members',
            value: Array.from(context.message.channel.guild.members.values()).sort((a, b) => b.joinedAt - a.joinedAt).map(m => `\`${m.username}#${m.discriminator}\``).splice(0, 5).join(` **>** `)
        }];
        context.message.channel.createMessage({
            content: `${context.message.channel.guild.name}'s info`,
            embed: {
                color: context.client.config.options.embedColor.generic,
                author: {
                    name: `Requested by: ${context.message.author.username}#${context.message.author.discriminator}`,
                    icon_url: context.message.author.avatarURL
                },
                thumbnail: {
                    url: context.message.channel.guild.iconURL ? context.message.channel.guild.iconURL : 'https://cdn.discordapp.com/attachments/480710816136560651/480710970243547144/defautIcon.png'
                },
                fields: embedFields,
                timestamp: new Date(),
                footer: {
                    text: context.client.bot.user.username,
                    icon_url: context.client.bot.user.avatarURL
                }
            }
        });
    }
}
module.exports = Sinfo;
