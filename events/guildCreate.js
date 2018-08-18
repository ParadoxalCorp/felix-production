class GuildCreateHandler {
    constructor() {}

    async handle(client, guild) {
        if (!client.handlers.DatabaseWrapper || !client.handlers.DatabaseWrapper.healthy) {
            return;
        }
        const guildIsInDb = await client.handlers.DatabaseWrapper.getGuild(guild.id);
        if (!guildIsInDb) {
            client.handlers.DatabaseWrapper.set(client.structures.References.guildEntry(guild.id))
                .catch(err => {
                    client.bot.emit('error', err);
                });
        }
    }
}

module.exports = new GuildCreateHandler();