const Command = require('../../structures/Command');

module.exports = class Ping extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            const now = Date.now();
            const message = await ctx.sendLocale('ping.pinging');
            return message.edit(ctx.returnLocale('ping.result', { roundtrip: Date.now() - now, heartbeat: ctx.shard.latency }));
        });
        this.setName('ping')
            .setDescription('Shows the latency between the bot and Discord');
    }
}