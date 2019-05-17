/**
 * @typedef {import("../../structures/Command").Context} context
 */

const os = require('os');
const Command = require("../../structures/Command");

module.exports = class Bot extends Command {
    constructor(client) {
        super(client, async (ctx) => {
            return ctx.msg.channel.createMessage({
                embed: {
                    thumbnail: {
                        url: ctx.client.user.avatarURL
                    },
                    color: Number(process.env.EMBED_COLOR),
                    author: {
                        name: `Requested by: ${ctx.msg.author.username}`,
                        icon_url: ctx.msg.author.avatarURL
                    },
                    fields: this.buildEmbedFields(ctx),
                    timestamp: new Date().toISOString(),
                    footer: {
                        icon_url: ctx.client.user.avatarURL,
                        text: ctx.guild.name
                    }
                }
            });
        });
        this.setName("bot")
            .setAliases(["sys", "info", "stats", "boat"])
            .setDescription("Display some ~~useless~~ info about Felix")
    }
    /**
     * @param {context} ctx 
     * @returns 
     */
    buildEmbedFields(ctx) {
        let embedFields = [];
        embedFields.push({
            name: "Servers/Guilds",
            value: String(ctx.client.guilds.size),
            inline: true
        });
        embedFields.push({
            name: "OS",
            value: `${process.platform}-${process.arch}`,
            inline: true
        });
        let averageCpuLoad = `${(os.loadavg()[1] * 100).toFixed(2)}%`;
        embedFields.push({
            name: 'Average CPU load',
            value: averageCpuLoad,
            inline: true
        });
        embedFields.push({
            name: "Node.js",
            value: `${process.release.lts ? process.release.lts : ''} ${process.version}`,
            inline: true
        });
        embedFields.push({
            name: "Cached users",
            value: String(ctx.client.users.size),
            inline: true
        });
        let uptime = ctx.client.utils.toElapsedTime(ctx.client.uptime);
        embedFields.push({
            name: "Uptime",
            // @ts-ignore
            value: `${uptime.days}d ${uptime.hours}h ${uptime.minutes}m ${uptime.seconds}s`,
            inline: true
        });
        embedFields.push({
            name: "Developers",
            value: "**Lead Developer**: ParadoxOrigins#5451\n**Co-Developers**: Niputi#2490, Ota#1354\n**Contributors**: InternalCosmos#2000, LevitatingBusinessMan#0504"
        });
        embedFields.push({
            name: "Created the",
            value: `${ctx.client.utils.toHumanDate(ctx.client.user.createdAt)}`,
            inline: true
        });
        embedFields.push({
            name: "Joined this server the",
            value: `${ctx.client.utils.toHumanDate(ctx.guild.joinedAt)}`,
            inline: true
        });
        embedFields.push({
            name: "Join the support server !",
            value: "[Felix support server invite link](https://discord.gg/Ud49hQJ)"
        });
        embedFields.push({
            name: "Invite Felix to your server",
            value: `[Felix's invite link](https://discordapp.com/oauth2/authorize?&client_id=${ctx.client.user.id}&scope=bot&permissions=2146950271)`
        });
        embedFields.push({
            name: 'Source',
            value: `[GitHub repository](https://github.com/ParadoxalCorp/felix-production)`
        });
        embedFields.push({
            name: 'Support us and become a donator !',
            value: '[Patreon](https://www.patreon.com/paradoxorigins)'
        });
        return embedFields;
    }
}