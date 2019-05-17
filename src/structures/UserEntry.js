/** @typedef {import("../Cluster")} Felix */

/**
 * @typedef {Object} premium
 * @prop {number} tier tier, 0 = deactivated, 0-5
 * @prop {number} expire time premium status should expire
 */

/**
 * @typedef {Object} experience
 * @property {number} amount exp
 */

/**
 * @typedef {object} lovecooldown
 * @prop {number} max
 * @prop {number[]} cooldowns
 */

/**
 * @typedef {object} cooldowns
 * @prop {number} dailyCooldown
 * @prop {lovecooldown} loveCooldown
 */

/**
* @typedef {Object} OwnedItem 
* @property {Number} count The amount of copy of this item the user has
* @property {Number} id The ID of the item
*/

/**
* @typedef {Object} TransactionData
* @property {Number} amount The change in the user's holy coins amount
* @property {String} from The ID of the user from who the coins once belonged
* @property {String} to The ID of who received the coins
* @property {String} reason The reason of the transfer
* @property {Number} date The UNIX timestamp of when the transfer happened 
*/

/**
 * @typedef {Object} UserEconomy 
 * @property {Number} coins The amount of holy coins this user has
 * @property {Array<TransactionData>} transactions The custom greetings/farewells message set on this guild, empty if none is set
 * @property {Array<OwnedItem>} items An array of items this user own
 */

/**
* @typedef {Object} UserLove 
* @property {Number} amount The amount of love points this user has been given
*/

/** 
 * @typedef {Object} UserData
 * @prop {String} _id The ID of the user
 * @prop {UserEconomy} economy An object that represent the economic state of the user
 * @prop {Boolean} blacklisted Whether this user is blacklisted
 * @prop {String} lang The language set for this user
 * @prop {premium} premium users premium data
 * @prop {experience} experience exp
 * @property {UserLove} love Whether this guild has the premium status, if a number, it is the UNIX timestamp when the premium status will expire. `true` in case of a monthly pledge
 * @prop {cooldowns} cooldowns cooldowns
 */

/**
 * - An interface for user entries, all methods except `update()` updates the data on this `UserEntry` instance, and convert the changes into MongoDB queries in the background
 * - The changes won't be saved unless `save()` is called
 * - If you want to return the updated data to the user, it is recommended to use the `UserEntry` instance returned by the `save()` method, as it is guaranteed to be what has been inserted into the database
 * - Changes directly done on `UserEntry.props` **won't be saved**, the `update()` method should be used for changes that aren't covered by the other methods
 * - While chaining calls is possible, chaining calls that update the same value (e.g: `addBank()` followed by `removeBank()`) won't work as intended, as the query for this field will be overwritten
 */
class UserEntry {
    /**
   *
   * @param {UserData} userData The user entry
   * @param {Felix} client The Memer instance
   */
    constructor(userData, client) {
        /** @type {UserData} The entry's properties */
        this.props = { ...client.db.getDefaultUser(userData._id), ...userData };
        this._client = client;
        this._changes = {};
        this._saved = 0;
    }

    /**
   * Manually update the user entry with the given data, note that the changes won't be reflected in the object
   * @param {Object} object The data to update this user with, mongodb operators such as `$set` must be used in the object properties
   * @example UserEntry.update({ coins: 2500 }) //This is an example, `addcoins()` should be used for that
   * @returns {UserEntry} The user entry, so calls can be chained
   */
    update(object) {
        if (typeof object !== "object") {
            throw new Error("Expected \"object\" parameter to be an object");
        }
        this._changes = this._client.utils.deepMerge(this._changes, object);
        return this;
    }

    /**
     * Add coins to the user's coins, this updates the `won` property too
     * @param {Number} amount The amount of coins to add to this user's coins
     * @returns {UserEntry} The user entry, so calls can be chained
     */
    addCoins(amount) {
        if (!amount) {
            throw new Error("Missing mandatory \"amount\" parameter");
        }
        amount = typeof amount !== "number" ? Number(amount) : amount;
        this.props.economy.coins = this.props.economy.coins + amount;
        this.update({ $inc: { "economy.coins": amount } });
        return this;
    }

    /**
   * Remove coins from the user's coins, this updates the `lost` property too
   * @param {Number} amount The amount of coins to remove from this user's coins
   * @returns {UserEntry} The user entry, so calls can be chained
   */
    removeCoins(amount) {
        if (!amount) {
            throw new Error("Missing mandatory \"amount\" parameter");
        }
        amount = typeof amount !== "number" ? Number(amount) : amount;
        this.props.economy.coins = this.props.economy.coins - amount;
        this.update({ $inc: { coins: -amount } });
        return this;
    }

    /**
     * Blacklist this user
     * @returns {UserEntry} The user entry, so calls can be chained
     * @memberof UserEntry
     */
    blacklist() {
        this.props.blacklisted = true;
        this.update({ $set: { blacklisted: true } });
        return this;
    }

    /**
     * Unblacklist this user
     * @returns {UserEntry} The user entry, so calls can be chained
     * @memberof UserEntry
     */
    unBlacklist() {
        this.props.blacklisted = false;
        this.update({ $set: { blacklisted: false } });
        return this;
    }

    /**
   * Saves the user into the database
   * @returns {Promise<void>} The promise representation of the save command sent
   */
    async save() {
        return this._client.mongodb.collection("users").findOneAndUpdate({ _id: this.props._id }, this._changes, { upsert: true, returnOriginal: false })
            .then(res => {
                this._saved = this._saved + 1;
                this.props = res.value;
                this._changes = {};
            });
    }

    /**
   * Returns this entry but as JSON
   * @returns {String} This entry stringified
   */
    toJSON() {
        return JSON.stringify(this.props);
    }

    /**
     * Add a cooldown to the user
     * @param {"dailyCooldown" | "loveCooldown"} cooldown - The name of the cooldown
     * @param {Number} duration - The duration in milliseconds of the cooldown
     * @returns {UserEntry}
     */
    addCooldown(cooldown, duration) {
        const cooldownObj = this.props.cooldowns[cooldown];
        if (typeof cooldownObj === 'object') {
            if (cooldownObj.cooldowns.length < cooldownObj.max) {
                const newLength = cooldownObj.cooldowns.push(Date.now() + duration);
                // @ts-ignore
                return cooldownObj.cooldowns[newLength - 1];
            }
            let oldestCooldown = cooldownObj.cooldowns.sort((a, b) => a - b)[0];
            cooldownObj.cooldowns[cooldownObj.cooldowns.findIndex(c => c === oldestCooldown)] = Date.now() + duration;
            // @ts-ignore
            return oldestCooldown;
        }
        this.props.cooldowns[cooldown] = Date.now() + duration;
        return this;
    }

    /**
     * Quickly compare the current timestamp with the cooldown to see if the user is in cooldown
     * @param {"dailyCooldown" | "loveCooldown"} cooldown - The name of the cooldown
     * @return {Boolean} Whether or not the user is in cooldown
     */
    isInCooldown(cooldown) {
        const cooldownObj = this.props.cooldowns[cooldown];
        if (typeof cooldownObj === 'object') {
            for (const cool of cooldownObj.cooldowns) {
                if (cool < Date.now()) {
                    return false;
                }
            }
            return cooldownObj.cooldowns.length < cooldownObj.max ? false : true;
        }
        return cooldownObj > Date.now();
    }

    /**
     * To use on a cooldown that can have multiple cooldowns, get the first cooldown that will expire
     * @param {"loveCooldown"} cooldown - The name of the cooldown
     * @returns {Number} The timestamp of the nearest cooldown, or undefined if all of them are expired
     */
    getNearestCooldown(cooldown) {
        const cooldownObj = this.props.cooldowns[cooldown];
        return cooldownObj.cooldowns.filter(c => c > Date.now()).sort((a, b) => a - b)[0];
    }
}

module.exports = UserEntry;