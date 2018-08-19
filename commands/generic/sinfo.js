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

  async run(client, message) {
    const embedFields = [{
      name: 'Name',
      value: message.channel.guild.name,
      inline: true
    },{
      name: 'Owner',
      value:  message.channel.guild.members.get(message.channel.guild.ownerID).user.username,
      inline: true
    },{
      name: 'Region',
      value: message.channel.guild.region,
      inline: true
    },{
      name: 'Shard',
      value: message.channel.guild.shard.id,
      inline: true
    },{
      name: 'Created the',
      value: TimeConverter.toHumanDate(message.channel.guild.createdAt, true),
      inline: true
    },{
      name: 'I\'m here since the',
      value: TimeConverter.toHumanDate(message.channel.guild.joinedAt, true),
      inline: true
    },{
      name: 'Members',
      value: `Users: ${message.channel.guild.members.filter(m => !m.user.bot).length}\nBots: ${message.channel.guild.members.filter(m => m.user.bot).length}`,
      inline: true
    },{
      name: 'Channels',
      value: `Texts: ${message.channel.guild.channels.filter(c => c.type === 0).length}\nVoices: ${message.channel.guild.channels.filter(c => c.type === 2).length}`,
      inline: true
    },{
      name: 'Roles',
      value: message.channel.guild.roles.size,
      inline: true
    },{
      name: '2FA',
      value: message.channel.guild.mfaLevel === 0 ? `:x:` : `:white_check_mark:`,
      inline: true
    },{
      name: 'Latest members',
      value: Array.from(message.channel.guild.members.values()).sort((a, b) => b.joinedAt - a.joinedAt).map(m => `\`${m.username}#${m.discriminator}\``).splice(0, 5).join(` **>** `)
    }];
    message.channel.createMessage({
      content: `${message.channel.guild.name}'s info`,
      embed: {
        color: client.config.embedColor.generic,
        author: {
          name: `Requested by: ${message.author.username}#${message.author.discriminator}`,
          icon_url: message.author.avatarURL
        },
        thumbnail: {
          url: message.channel.guild.iconURL ? message.channel.guild.iconURL : 'https://cdn.discordapp.com/attachments/480710816136560651/480710970243547144/defautIcon.png'
        },
        fields: embedFields,
        timestamp: new Date(),
        footer: {
            text: client.bot.user.username,
            icon_url: client.bot.user.avatarURL
        }
      }
    });
  };
}
module.exports = new Sinfo();
