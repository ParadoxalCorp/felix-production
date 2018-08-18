const Endpoints = require('../node_modules/eris/lib/rest/Endpoints');
/** @typedef {import("../structures/ExtendedStructures/ExtendedUser.js")} ExtendedUser 
 * @typedef {import("../main.js")} Client   
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

    /**
     * Censor the critical credentials (token and such) from the given text
     * @param {String} text - The text from which to replace all credentials
     * @returns {String} The redacted text
     */
    redact(text) {
        let credentials = [this.client.config.token, this.client.config.database.host];
        const secondaryCredentials = [
            this.client.config.apiKeys.sentryDSN, 
            this.client.config.database.password, 
            this.client.config.apiKeys.weebSH
        ];
        for (const node of this.client.config.options.music.nodes) {
            secondaryCredentials.push(node.password, node.host);
        }
        for (const botList in this.client.config.botLists) {
            if (this.client.config.botLists[botList].token) {
                secondaryCredentials.push(this.client.config.botLists[botList].token);
            }
        }
        for (const value of secondaryCredentials) {
            if (value) {
                credentials.push(value);
            }
        }
        const credentialRX = new RegExp(
            credentials.join('|'),
            'gi'
        );
    
        return text.replace(credentialRX, 'baguette');
    }
}

module.exports = Utils;