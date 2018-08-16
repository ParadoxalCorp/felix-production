/** 
 * @typedef {import("eris").Message} Message
 * @typedef {import("eris").Emoji} Emoji
 * @typedef {import("../main.js").Client} Client
 */

 /** @typedef {Object} CollectedEmoji
  * @prop {String} name The name of the emoji
  * @prop {String} id The ID of the emoji
  * @prop {Boolean} animated Whether the emoji is animated
  */


/**
 * A reaction collector which does not create a new event listener each collectors, but rather only use one added when its instantiated
 * @prop {object} collectors An object representing all the ongoing collectors
 */
class ReactionCollector {
    /**
     * Instantiating this class create a new messageReactionAdd listener, which will be used for all calls to awaitReaction
     * @param {Client} client - The client instance
     */
    constructor(client) {
        this.collectors = {};

        client.bot.on('messageReactionAdd', this.verify.bind(this));
    }

    /**
     * Verify if the reaction pass the condition of the filter function
     * @param {Message} msg - The message
     * @param {Emoji} emoji - The emoji
     * @param {String} userID - the ID of the user
     * @returns {Promise<void>} returns object
     * @private
     */
    async verify(msg, emoji, userID) {
        const collector = this.collectors[msg.channel.id + msg.id + userID];
        if (collector && collector.filter(msg, emoji, userID)) {
            collector.resolve({
                message: msg,
                emoji: emoji,
                userID: userID
            });
        }
    }

    /**
     * Await a reaction from the specified user in the specified channel
     * @param {String} channelID - The ID of the channel to await a reaction in
     * @param {String} messageID - The ID of the message to await a reaction on
     * @param {String} userID - The ID of the user to await a reaction from
     * @param {Number} [timeout=60000] - Time in milliseconds before the collect should be aborted
     * @param {Function} [filter] - A function that will be tested against the reactions of the user, by default always resolve to true
     * @returns {Promise<{message: Message, emoji: CollectedEmoji, userID: String}>} An object with the message, emoji and userID properties, or false if the timeout has elapsed
     */
    awaitReaction(channelID, messageID, userID, timeout = 60000, filter = () => true) {
        return new Promise(resolve => {
            if (this.collectors[channelID + messageID + userID]) {
                delete this.collectors[channelID + messageID + userID];
            }

            this.collectors[channelID + messageID + userID] = { resolve, filter };

            setTimeout(resolve.bind(null, false), timeout);
        });
    }
}

module.exports = ReactionCollector;