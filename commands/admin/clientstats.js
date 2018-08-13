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
        const normalizeMemory = (memory) => `${(memory / 1024 / 1024).toFixed(2)}MB`;
        const normalizeLoad = (load) => `${(load * 100).toFixed(2)}%`;
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
                    },
                    {
                        name: 'Lavalink nodes',
                        value: (() => {
                            let nodesStatus = '```ini\n';
                            for (const node of client.config.options.music.nodes) {
                                const lavalinkNode = client.bot.voiceConnections.nodes.get(node.host);
                                nodesStatus += `[${node.location}]: ${lavalinkNode.connected ? '[Online]' : '[Offline]'}\n`;
                                nodesStatus += `=> Used memory: [${normalizeMemory(lavalinkNode.stats.memory.used)}]\n`;
                                nodesStatus += `=> Allocated memory: [${normalizeMemory(lavalinkNode.stats.memory.allocated)}]\n`;
                                nodesStatus += `=> Free memory: [${normalizeMemory(lavalinkNode.stats.memory.free)}]\n`;
                                nodesStatus += `=> Reservable memory: [${normalizeMemory(lavalinkNode.stats.memory.reservable)}]\n`;
                                nodesStatus += `=> Cores: [${lavalinkNode.stats.cpu.cores}]\n`;
                                nodesStatus += `=> System load: [${normalizeLoad(lavalinkNode.stats.cpu.systemLoad)}]\n`;
                                nodesStatus += `=> Node load: [${normalizeLoad(lavalinkNode.stats.cpu.lavalinkLoad)}]\n`;
                                nodesStatus += `=> Uptime: [${client.timeConverter.toElapsedTime(lavalinkNode.stats.uptime, true)}]\n`;
                                nodesStatus += `=> Players: [${lavalinkNode.stats.players}]\n`;
                                nodesStatus += `=> Paused players: [${lavalinkNode.stats.players - lavalinkNode.stats.playingPlayers}]\n`;
                            }
                            return nodesStatus + '```';
                        })()
                    }
                ],
                color: client.config.options.embedColor
            }
        });
        const clustersShardsStats = await client.IPCHandler.fetchShardsStats();
        return message.channel.createMessage('```ini\n' + client.stats.clusters.map(c => {
            const cluster = clustersShardsStats.find(cl => cl.clusterID === c.cluster);
            let clusterStats = `Cluster [${c.cluster}]: [${c.shards}] shard(s) | [${c.guilds}] guild(s) | [${c.ram.toFixed(2)}]MB RAM used | Up for [${client.timeConverter.toElapsedTime(c.uptime, true)}] | Music connections: [${cluster.data[0].musicConnections}]\n`;
            for (const shard of cluster.data) {
                clusterStats += `=> Shard [${shard.id}]: [${shard.guilds}] guild(s) | [${shard.status}] | ~[${shard.latency}]ms\n`;
            }
            return clusterStats;
        }).join('\n--\n') + '```');
    }
}

module.exports = new ClientStats();