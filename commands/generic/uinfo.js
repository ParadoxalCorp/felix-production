const GenericCommands = require('../../structures/CommandCategories/GenericCommands');

class Uinfo extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'uinfo',
                description: 'Display some ~~useless~~ info about the user',
                usage: '{prefix}uinfo'
            },
            conf: {
                aliases: ['userinfo', 'profile'],
                requireDB: true,
                guildOnly: true
            }
        });
    }
    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        const user = await this.getUserFromText({ message: context.message, client: context.client, text: context.args[0] });
        const target = user || context.message.author;
        const targetEntry = target.id !== context.message.author.id ? await context.client.handlers.DatabaseWrapper.getUser(target.id) : context.userEntry;
        const localLevelDetails = context.client.handlers.ExperienceHandler.getLevelDetails(context.guildEntry.getLevelOf(target.id));
        const globalLevelDetails = context.client.handlers.ExperienceHandler.getLevelDetails(targetEntry.getLevel());
        const userExp = context.guildEntry.experience.members.find(u => u.id === target.id) ? context.guildEntry.experience.members.find(u => u.id === target.id).experience : 0;
        const member = context.message.channel.guild.members.get(target.id);

        const embedFields = [{
            name: 'Name/Tag',
            value: `${member.username}#${member.discriminator}`,
            inline: true
        },{
            name: 'Nickname',
            value: member.nick ? member.nick : 'None',
            inline: true
        },{
            name: 'Status',
            value: member.status,
            inline: true
        },{
            name: 'Game',
            value: member.game ? member.game.name : 'None',
            inline: true
        },{
            name: "Created",
            value: context.client.utils.timeConverter.toHumanDate(member.createdAt),
            inline: true
        },{
            name: "Joined",
            value: context.client.utils.timeConverter.toHumanDate(member.joinedAt),
            inline: true
        },{
            name: 'Love points',
            value: `${targetEntry.love.amount}`,
            inline: true
        },{
            name: "Coins",
            value: `${targetEntry.economy.coins}`,
            inline: true
        },{
            name: "Local experience",
            value: `Level: ${localLevelDetails.level}
      Exp: ${userExp}
      Level progress: ${(userExp - localLevelDetails.thisLevelExp)} / ${(localLevelDetails.nextLevelExp - localLevelDetails.thisLevelExp)}`,
            inline: true
        },{
            name: 'Global experience',
            value: `Level: ${globalLevelDetails.level}
      Exp: ${targetEntry.experience.amount}
      Level progress: ${(targetEntry.experience.amount - globalLevelDetails.thisLevelExp)} / ${(globalLevelDetails.nextLevelExp - globalLevelDetails.thisLevelExp)}`,
            inline: true
        },{
            name: `Roles: (${member.roles.length})`,
            value: member.roles.length === 0 ? 'No role' : this.sliceRoles(member.roles.sort((a,b) => member.guild.roles.get(b).position - member.guild.roles.get(a).position).map(r => `<@&${r}>`))
        }];
        context.message.channel.createMessage({
            content: `${member.username}'s info`,
            embed: {
                color: context.client.config.options.embedColor.generic,
                author: {
                    name: `Requested by: ${context.message.author.username}#${context.message.author.discriminator}`,
                    icon_url: context.message.author.avatarURL
                },
                thumbnail: {
                    url: target.avatarURL
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

    sliceRoles(roles) {
        let text = '';
        let i = 0;
        for (const role of roles) {
            if (text.length < 980) {
                text += i === (roles.length - 1) ? role : `${role}, `;
            } else {
                return text += `and ${roles.length - (i + 1)} more...`;
            }
            i++;
        }
        return text;
    }
}
module.exports = Uinfo;
