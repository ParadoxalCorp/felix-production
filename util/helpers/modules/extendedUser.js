'use strict';

/**
 * @typedef {import("eris").User} ErisUser
 */

/**
 * @typedef {Function} extendUser
 * Add some properties and methods to the user object
 * @param {ErisUser} user - The user to extend
 * @returns {ExtendedUser} The given user with additional properties
 */
const extendUser = (user) => {
    //Backward compatibility with pre-4.4.x versions
    return new this.structures.ExtendedUser(user, this);
};

module.exports = extendUser;