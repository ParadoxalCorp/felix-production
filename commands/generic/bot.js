const TimeConverter = require(`../../utils/TimeConverter.js`);
const moment = require("moment");
const os = require('os');

const GenericCommands = require('../../structures/CommandCategories/GenericCommands');

class Bot extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'bot',
                description: 'Display some ~~useless~~ info about Felix',
                usage: '{prefix}bot',
            },
            conf: {
                aliases: ["sys", "info", "stats", "boat"],
                guildOnly: true
            }
        });
    }

    /** @param {import("../../structures/Contexts/GenericContext")} context */

    async run(context) {
        return context.message.channel.createMessage({
            embed: {
                thumbnail: {
                    url: context.client.bot.user.avatarURL
                },
                color: context.client.config.options.embedColor.generic,
                author: {
                    name: `Requested by: ${context.message.author.tag}`,
                    icon_url: context.message.author.avatarURL
                },
                fields: this.buildEmbedFields(context),
                timestamp: new Date(),
                footer: {
                    icon_url: context.client.bot.user.avatarURL,
                    text: context.message.channel.guild.name
                }
            }
        });
    }

    buildEmbedFields(context) {
        let embedFields = [];
        embedFields.push({
            name: "Servers/Guilds",
            value: context.client.bot.guilds.size,
            inline: true
        });
        embedFields.push({
            name: "OS",
            value: `${process.platform}-${process.arch}`,
            inline: true
        });
        embedFields.push({
            name: "RAM usage",
            value: context.client.stats ? `${context.client.stats.totalRam.toFixed(2)}MB` : `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
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
            // @ts-ignore
            value: `${process.release.lts ? process.release.lts : ''} ${process.version}`,
            inline: true
        });
        embedFields.push({
            name: "Version",
            value: context.client.package.version,
            inline: true
        });
        embedFields.push({
            name: "Cached users",
            value: context.client.bot.users.size,
            inline: true
        });
        let uptime = TimeConverter.toElapsedTime(context.client.bot.uptime);
        embedFields.push({
            name: "Uptime",
            // @ts-ignore
            value: `${uptime.days}d ${uptime.hours}h ${uptime.minutes}m ${uptime.seconds}s`,
            inline: true
        });
        embedFields.push({
            name: "Developers",
            value: "**Lead Developer**: ParadoxOrigins#5451\n**Co-Developers**: Ota#1354, Niputi#2490\n**Contributors**: InternalCosmos#2000, LevitatingBusinessMan#0504"
        });
        embedFields.push({
            name: "Created the",
            value: `${TimeConverter.toHumanDate(context.client.bot.user.createdAt)} (${moment().to(context.client.bot.user.createdAt)})`,
            inline: true
        });
        embedFields.push({
            name: "Joined this server the",
            value: `${TimeConverter.toHumanDate(context.message.channel.guild.joinedAt)} (${moment().to(context.message.channel.guild.joinedAt)})`,
            inline: true
        });
        embedFields.push({
            name: "Join the support server !",
            value: "[Felix support server invite link](https://discord.gg/Ud49hQJ)"
        });
        embedFields.push({
            name: "Invite Felix to your server",
            value: `[Felix's invite link](https://discordapp.com/oauth2/authorize?&client_id=${context.client.bot.user.id}&scope=bot&permissions=2146950271)`
        });
        embedFields.push({
            name: 'Source',
            value: `[GitHub repository](https://github.com/ParadoxalCorp/felix-production)`
        });
        embedFields.push({
            name: 'Support us and become a donator !',
            value: '[Patreon](https://www.patreon.com/paradoxorigins)'
        });
        if (context.client.stats) {
            embedFields.push({
                name: `Shard`,
                value: (() => {
                    let shardCount = 0;
                    for (const cluster of context.client.stats.clusters) {
                        shardCount = shardCount + cluster.shards;
                    }
                    return `${context.message.channel.guild.shard.id}/${shardCount}`;
                })(),
                inline: context.client.handlers.RedisManager ? false : true
            });
        }
        embedFields.push({
            name: 'Database status',
            value: `${context.client.handlers.DatabaseWrapper && context.client.handlers.DatabaseWrapper.healthy ? ('Online ' + context.emote('online')) : ('Offline ' + context.emote('offline'))}\n[More info](https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#rethinkdb)`,
            inline: true
        });
        if (context.client.handlers.RedisManager) {
            embedFields.push({
                name: 'Redis status',
                value: `${context.client.handlers.RedisManager.healthy ? ('Online ' + context.emote('online')) : ('Offline ' + context.emote('offline'))}\n[More info](https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#redis)`,
                inline: true
            });
        }
        if (context.client.config.options.music.enabled && context.client.config.options.music.nodes[0]) {
            embedFields.push({
                name: 'Music nodes',
                value: (() => {
                    let nodesStatus = '';
                    for (const node of context.client.config.options.music.nodes) {
                        nodesStatus += `${node.location}: ${context.client.bot.voiceConnections.nodes.get(node.host).connected ? ('Online ' + context.emote('online')) : ('Offline ' + context.emote('offline'))}\n`;
                    }
                    nodesStatus += `[More info](https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#music-nodes)`;
                    return nodesStatus;
                })()
            });
        }
        return embedFields;
    }
}

module.exports = Bot;