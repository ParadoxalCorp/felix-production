// @ts-nocheck
//Stolen from Tweetcord (https://github.com/Aetheryx/tweetcord) the 20/03/18
//With some JSDoc added cuz its useful kek

/** 
 * @typedef {import("eris").Message} Message 
 * @typedef {import("../Cluster.js")} Client
 * @typedef {import("eris").Collection} Collection
 **/

const Collection = require("eris").Collection;

/**
 * A message collector which does not create a new event listener each collectors, but rather only use one added when its instantiated
 * @prop {Object} collectors An object representing all the ongoing collectors
 * @prop {Client} client The client instance
 */
class MessageCollector {
    /**
     * Instantiating this class create a new messageCreate listener, which will be used for all calls to awaitMessage
     * @param {Client} client - The client instance
     * @param {{collectors: Collection}} [options={}] - An additional object of options
     */
    constructor(client, options = {}) {
        this.collectors = options.collectors || new Collection();
        this.client = client;
        client.on("messageCreate", this.verify.bind(this));
    }

    /**
     * Verify if the message pass the condition of the filter function
     * @param {*} msg The message to verify
     * @returns {Promise<void>} verify
     * @private
     */
    async verify(msg) {
        if (!msg.author) {
            return;
        }
        const collector = this.collectors.get(msg.channel.id + msg.author.id);
        if (collector && collector.filter(msg)) {
            collector.resolve(msg);
        }
    }

    /**
     * Await a message from the specified user in the specified channel
     * @param {object} channelID - The ID of the channel to await a message in
     * @param {object} userID - The ID of the user to await a message from
     * @param {number} [timeout=60000] - Time in milliseconds before the collect should be aborted
     * @param {function} [filter] - A function that will be tested against the messages of the user, by default always resolve to true
     * @returns {Promise<Message>} The message, or false if the timeout has elapsed
     */
    awaitMessage(channelID, userID, timeout = 60000, filter = () => true) {
        return new Promise(resolve => {
            if (this.collectors.get(channelID + userID)) {
                this.collectors.delete(channelID + userID);
            }

            this.collectors.set(channelID + userID, { resolve, filter });

            setTimeout(resolve.bind(null, false), timeout);
        });
    }

    _reload() {
        delete require.cache[module.filename];
        this.client.bot.removeListener("messageCreate", this.verify.bind(this));
        return new(require(module.filename))(this.client, this.collectors);
    }
}

module.exports = MessageCollector;