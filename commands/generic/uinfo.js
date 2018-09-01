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
        const target = await context.setTarget(await context.getUserFromText(context.args.join(' ')) || context.message.author);

        const embedFields = [{
            name: 'Name/Tag',
            value: `${target.member.username}#${target.member.discriminator}`,
            inline: true
        },{
            name: 'Nickname',
            value: target.member.nick ? target.member.nick : 'None',
            inline: true
        },{
            name: 'Status',
            value: target.member.status,
            inline: true
        },{
            name: 'Game',
            value: target.member.game ? target.member.game.name : 'None',
            inline: true
        },{
            name: "Created",
            value: context.client.utils.timeConverter.toHumanDate(target.member.createdAt),
            inline: true
        },{
            name: "Joined",
            value: context.client.utils.timeConverter.toHumanDate(target.member.joinedAt),
            inline: true
        },{
            name: 'Love points',
            value: `${target.userEntry.love.amount}`,
            inline: true
        },{
            name: "Coins",
            value: `${target.userEntry.economy.coins}`,
            inline: true
        },{
            name: "Local experience",
            value: `Level: ${target.localLevelDetails.level}
      Exp: ${target.localExperience}
      Level progress: ${(target.localExperience - target.localLevelDetails.thisLevelExp)} / ${(target.localLevelDetails.nextLevelExp - target.localLevelDetails.thisLevelExp)}`,
            inline: true
        },{
            name: 'Global experience',
            value: `Level: ${target.globalLevelDetails.level}
      Exp: ${target.userEntry.experience.amount}
      Level progress: ${(target.userEntry.experience.amount - target.globalLevelDetails.thisLevelExp)} / ${(target.globalLevelDetails.nextLevelExp - target.globalLevelDetails.thisLevelExp)}`,
            inline: true
        },{
            name: `Roles: (${target.member.roles.length})`,
            value: target.member.roles.length === 0 ? 'No role' : this.sliceRoles(target.member.roles.sort((a,b) => target.member.guild.roles.get(b).position - target.member.guild.roles.get(a).position).map(r => `<@&${r}>`))
        }];
        context.message.channel.createMessage({
            content: `${target.member.username}'s info`,
            embed: {
                color: context.client.config.options.embedColor.generic,
                author: {
                    name: `Requested by: ${context.message.author.username}#${context.message.author.discriminator}`,
                    icon_url: context.message.author.avatarURL
                },
                thumbnail: {
                    url: target.user.avatarURL
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
