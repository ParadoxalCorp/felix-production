// @ts-nocheck
/** 
 * @typedef {import('eris').Message} Message 
 * @typedef {import('../Cluster')} Felix
 */

module.exports = new class MessageCreate {
    /**
     *
     * Handles messageCreate events
     * @param {Felix} client The client instance
     * @param {Message} msg The message
     * @returns {Promise<void>} Nothing
     */
    async handle (client, msg) {
        if (msg.author.bot) {
            return;
        }
        const userEntry = await client.db.getUser(msg.author.id); 
        const guildEntry = msg.channel.guild ? await client.db.getGuild(msg.channel.guild.id) : null;
        const command = client.utils.parseCommand(msg, guildEntry);
        if (!command) {
            return;
        }
        const toSplice = guildEntry ? (guildEntry.props.spacedPrefix || msg.content.startsWith(`<@${client.user.id}>`) || msg.content.startsWith(`<@!${client.user.id}`) ? 2 : 1) : 2;
        const args = msg.content.split(/\s+/gim).splice(toSplice);
        const validatedArgs = client.utils.validateArgs(args, command);
        if (validatedArgs !== true) {
            return msg.channel.createMessage(validatedArgs).catch(() => {});
        }
        const parsedArgs = client.utils.parseArgs(args, command);
        const ctx = new client.structures.Context(msg, client, guildEntry, userEntry, parsedArgs);
        const output = await command.run(ctx);
        if (typeof output === "string" || output.embed) {
            return msg.channel.createMessage(output).catch(() => {});
        }
    }
}();