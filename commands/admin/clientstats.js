'use strict';

const Command = require('../../util/helpers/modules/Command');

class ClientStats extends Command {
    constructor() {
        super();
        this.help = {
            name: 'clientstats',
            category: 'admin',
            description: 'Get detailed statistics about the bot',
            usage: '{prefix}stats'
        };
        this.conf = {
            requireDB: false,
            disabled: false,
            aliases: ["cs", "botstats"],
            requirePerms: [],
            guildOnly: false,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    async run(client, message) {
        if (client.bot.uptime < 60000) {
            return message.channel.createMessage(`:x: Please wait another ${60000 - client.bot.uptime}ms`);
        }
        await message.channel.createMessage({
            embed: {
                title: ':gear: Client stats',
                fields: [{
                        name: 'Clusters',
                        value: `Total: ${client.stats.clusters.length}\nActive: ${client.stats.clusters.length - client.stats.clusters.filter(c => c.guilds < 1).length}`,
                        inline: true
                    },
                    {
                        name: 'RAM usage',
                        value: `${client.stats.totalRam.toFixed(2)}MB`,
                        inline: true
                    },
                    {
                        name: 'General stats',
                        value: `Guilds: ${client.stats.guilds} | Cached users: ${client.stats.users} | Large guilds: ${client.stats.largeGuilds}`
                    }
                ],
                color: client.config.options.embedColor
            }
        });
        const clustersShardsStats = await client.IPCHandler.fetchShardsStats();
        return message.channel.createMessage('```ini\n' + client.stats.clusters.map(c => {
            let clusterStats = `Cluster [${c.cluster}]: [${c.shards}] shard(s) | [${c.guilds}] guild(s) | [${c.ram.toFixed(2)}]MB RAM used | Up for [${client.timeConverter.toElapsedTime(c.uptime, true)}]\n`;
            for (const shard of clustersShardsStats.find(cluster => cluster.clusterID === c.cluster).data) {
                clusterStats += `=> Shard [${shard.id}]: [${shard.guilds}] guild(s) | [${shard.status}] | ~[${shard.latency}]ms\n`;
            }
            return clusterStats;
        }).join('\n--\n') + '```');
    }
}

module.exports = new ClientStats();