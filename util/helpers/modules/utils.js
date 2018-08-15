'use strict';

const Endpoints = require('../../../node_modules/eris/lib/rest/Endpoints');
/** @typedef {import("../../../structures/ExtendedUser.js")} ExtendedUser 
 * @typedef {import("../../../main.js").Felix} Client
*/

class Utils {
    /**
     * 
     * @param {Client} client - The client instance
     */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
    }

    /**
     * 
     * @param {String} id - The ID of the user to fetch
     * @returns {ExtendedUser} The user, or null if none was resolved
     */
    fetchUser(id) {
        const cachedUser = this.client.bot.users.get(id);
        if (cachedUser) {
            return (cachedUser ? (cachedUser instanceof this.client.structures.ExtendedUser) : false) ? cachedUser : new this.client.structures.ExtendedUser(cachedUser, this.client);
        } else {
            return this.client.bot.requestHandler.request('GET', Endpoints.USER(id), true)
              .catch(e => {
                if (e.message.includes('Unknown User')) {
                  return null;
                }
              }).then(u => {
                  if (!u) {
                      return u;
                  }
                  const newUser = new this.client.structures.ExtendedUser(u, this.client);
                  this.client.bot.users.set(id, newUser);
                  return newUser;
              });
          }
    }
}

module.exports = Utils;