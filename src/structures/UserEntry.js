// @ts-nocheck
/** @typedef {import("../Cluster")} Felix */

/** @typedef {Object} UserData
 * @prop {String} _id The ID of the user
 * @prop {Number} coins The coins this user has
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
    constructor (userData, client) {
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
    update (object) {
        if (typeof object !== 'object') {
            throw new Error('Expected "object" parameter to be an object');
        }
        this._changes = this._client.utils.deepMerge(this._changes, object);
        return this;
    }

    /**
   * Add coins to the user's coins, this updates the `won` property too
   * @param {Number} amount The amount of coins to add to this user's coins
   * @returns {UserEntry} The user entry, so calls can be chained
   */
    addCoins (amount) {
        if (!amount) {
            throw new Error('Missing mandatory "amount" parameter');
        }
        amount = typeof amount !== 'number' ? Number(amount) : amount;
        this.props.coins = this.props.coins + amount;
        this.update( {$inc: { coins: amount } });
        return this;
    }

    /**
   * Remove coins from the user's coins, this updates the `lost` property too
   * @param {Number} amount The amount of coins to remove from this user's coins
   * @returns {UserEntry} The user entry, so calls can be chained
   */
    removeCoins (amount) {
        if (!amount) {
            throw new Error('Missing mandatory "amount" parameter');
        }
        amount = typeof amount !== 'number' ? Number(amount) : amount;
        this.props.coins = this.props.coins - amount;
        this.update( {$inc: { coins: -amount } });
        return this;
    }

    /**
   * Saves the user into the database
   * @returns {Promise<void>} The promise representation of the save command sent
   */
    async save () {
        return this._client.mongodb.collection('users').findOneAndUpdate({ _id: this.props._id }, this._changes, { upsert: true })
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
    toJSON () {
        return JSON.stringify(this.props);
    }
}

module.exports = UserEntry;