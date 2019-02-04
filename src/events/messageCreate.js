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
        if (msg.content === "!!ping") {
            let user = await client.db.getUser(msg.author.id);
            await user.addCoins(500).save();
            return msg.channel.createMessage(`You have ${user.props.coins}`);
        }
    }
}();