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
            let user = await client.dbHandler.getUser(msg.author.id);
            user.update({ baguette: 'baguette' }, async(err, res) => {
                if (!err) {
                    user = await client.dbHandler.getUser(msg.author.id);
                    msg.channel.createMessage(`Your ID is ${user.baguette}`);
                } else {
                    console.error(err);
                }
            }); 
            return;
        }
    }
}();