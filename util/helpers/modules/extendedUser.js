'use strict';

/**
 * @typedef {import("eris").User} ErisUser
 */

 /**  */
const User = require("eris").User;

/**
 * @extends User
 */
class ExtendedUser extends User {
    constructor(user, client) {
        super(user, client);
    }

    /**
     * @returns {String} Returns the Username#Discriminator of the user
     */
    get tag() {
        return `${this.username}#${this.discriminator}`;
    }

    /**
     * Sends a DM to the user
     * @param {String | Object} message The message content
     * @param {Object} file A file to upload along
     * @returns {Promise<import("eris").Message>} The sent message
     */

    createMessage(message, file) {
        return this.getDMChannel().then(c => {
            return c.createMessage(message, file);
        });
    }

    /**
     * @returns {String} The CDN URL of the default avatar of this user
     */
    get defaultCDNAvatar() {
        return `https://cdn.discordapp.com/embed/avatars/${this.discriminator % 5}.png`;
    }
}

/**
 * @typedef {Function} extendUser
 * Add some properties and methods to the user object
 * @param {ErisUser} user - The user to extend
 * @returns {ExtendedUser} The given user with additional properties
 */
const extendUser = (user) => {
    //Backward compatibility with pre-4.4.x versions
    return new ExtendedUser(user, this);
};

module.exports = extendUser;