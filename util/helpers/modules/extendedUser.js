'use strict';

//eslint-disable-file valid-jsdoc

/**
 * @typedef {import("eris").User} ErisUser
 */

/**
 * @typedef {Function} extendUser
 * Add some properties and methods to the user object
 * @param {ErisUser} user - The user to extend 
 * @returns {ExtendedUser} The given user with additional properties
 */
const extendUser = (client, user) => {
    //Backward compatibility with pre-4.4.x versions
    return new client.structures.ExtendedUser(user, client);
};

module.exports = extendUser;