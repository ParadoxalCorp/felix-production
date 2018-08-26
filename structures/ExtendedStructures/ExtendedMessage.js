/** @typedef {import("../../main").Client} Client 
 * @typedef {import("./ExtendedUser")} ExtendedUser
*/

const Message = require('eris').Message; //eslint-disable-line no-unused-vars

/** @typedef {Object} AdditionalProperties
 * @prop {Client} client The client instance
 * @prop {ExtendedUser} author The message author
 */

/**
 * @class ExtendedMessage
 * @typedef {Message & AdditionalProperties} ExtendedMessage
 */

class ExtendedMessage {
    /**
     * 
     * @param {Message} message - The message
     * @param {Client} client - The client instance
     */
    constructor(message, client) {
        Object.assign(this, {
            client,
            author: new client.structures.ExtendedUser(message.author, client)
        }, message);
    }
}

module.exports = ExtendedMessage;