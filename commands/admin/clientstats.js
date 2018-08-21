const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class ClientStats extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'clientstats',
                description: 'Get detailed statistics about the bot',
                usage: '{prefix}stats'
            },
            conf: {
                aliases: ["cs", "botstats"],
            }
        });
    }
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        if (context.client.bot.uptime < 60000) {
            return context.message.channel.createMessage(`:x: Please wait another ${60000 - context.client.bot.uptime}ms`);
        }
        const normalizeMemory = (memory) => `${(memory / 1024 / 1024).toFixed(2)}MB`;
        const normalizeLoad = (load) => `${(load * 100).toFixed(2)}%`;
        await context.message.channel.createMessage({
            embed: {
                title: ':gear: Client stats',
                fields: [{
                    name: 'Clusters',
                    value: `Total: ${context.client.stats.clusters.length}\nActive: ${context.client.stats.clusters.length - context.client.stats.clusters.filter(c => c.guilds < 1).length}`,
                    inline: true
                },
                {
                    name: 'RAM usage',
                    value: `${context.client.stats.totalRam.toFixed(2)}MB`,
                    inline: true
                },
                {
                    name: 'General stats',
                    value: `Guilds: ${context.client.stats.guilds} | Cached users: ${context.client.stats.users} | Large guilds: ${context.client.stats.largeGuilds}`
                },
                {
                    name: 'Lavalink nodes',
                    value: (() => {
                        let nodesStatus = '```ini\n';
                        for (const node of context.client.config.options.music.nodes) {
                            const lavalinkNode = context.client.bot.voiceConnections.nodes.get(node.host);
                            nodesStatus += `[${node.location}]: ${lavalinkNode.connected ? '[Online]' : '[Offline]'}\n`;
                            nodesStatus += `=> Used memory: [${normalizeMemory(lavalinkNode.stats.memory.used)}]\n`;
                            nodesStatus += `=> Allocated memory: [${normalizeMemory(lavalinkNode.stats.memory.allocated)}]\n`;
                            nodesStatus += `=> Free memory: [${normalizeMemory(lavalinkNode.stats.memory.free)}]\n`;
                            nodesStatus += `=> Reservable memory: [${normalizeMemory(lavalinkNode.stats.memory.reservable)}]\n`;
                            nodesStatus += `=> Cores: [${lavalinkNode.stats.cpu.cores}]\n`;
                            nodesStatus += `=> System load: [${normalizeLoad(lavalinkNode.stats.cpu.systemLoad)}]\n`;
                            nodesStatus += `=> Node load: [${normalizeLoad(lavalinkNode.stats.cpu.lavalinkLoad)}]\n`;
                            nodesStatus += `=> Uptime: [${context.client.utils.TimeConverter.toElapsedTime(lavalinkNode.stats.uptime, true)}]\n`;
                            nodesStatus += `=> Players: [${lavalinkNode.stats.players}]\n`;
                            nodesStatus += `=> Paused players: [${lavalinkNode.stats.players - lavalinkNode.stats.playingPlayers}]\n`;
                        }
                        return nodesStatus + '```';
                    })()
                }
                ],
                color: context.client.config.options.embedColor.generic
            }
        });
        const clustersShardsStats = await context.client.handlers.IPCHandler.fetchShardsStats();
        return context.message.channel.createMessage('```ini\n' + context.client.stats.clusters.map(c => {
            const cluster = clustersShardsStats.find(cl => cl.clusterID === c.cluster);
            let clusterStats = `Cluster [${c.cluster}]: [${c.shards}] shard(s) | [${c.guilds}] guild(s) | [${c.ram.toFixed(2)}]MB RAM used | Up for [${context.client.utils.TimeConverter.toElapsedTime(c.uptime, true)}] | Music connections: [${cluster.data[0].musicConnections}]\n`;
            for (const shard of cluster.data) {
                clusterStats += `=> Shard [${shard.id}]: [${shard.guilds}] guild(s) | [${shard.status}] | ~[${shard.latency}]ms\n`;
            }
            return clusterStats;
        }).join('\n--\n') + '```');
    }
}

module.exports = ClientStats;