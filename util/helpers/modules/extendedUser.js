'use strict';

/**
 * Add some properties and methods to the user object
 * @param {object} user - The user to extend
 * @returns {user} The given user with additional properties
 */
const extendUser = (user) => {
    return Object.defineProperties(user, {
        tag: {
            value: `${user.username}#${user.discriminator}`,
            writable: true
        },
        createMessage: {
            value: async(message) => {
                return user.getDMChannel().then(c => {
                    return c.createMessage(message);
                });
            },
            writable: true
        },
        defaultCDNAvatar: {
            value: `https://cdn.discordapp.com/embed/avatars/${user.discriminator % 5}.png`,
            writable: true
        }
    });
};

module.exports = extendUser;