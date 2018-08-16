const User = require("eris").User;

/**
 * @extends User
 */
class ExtendedUser extends User {
    /**
     * 
     * @param {User} user 
     * @param {import("../main.js")} client - The client instance
     */
    
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

module.exports = ExtendedUser;