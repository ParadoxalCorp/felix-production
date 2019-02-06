// @ts-nocheck
/** @typedef {import("../Cluster")} Felix */

/** 
 * @typedef {Object} GuildData
 * @prop {String} _id The ID of the user
 * @prop {String} [prefix] The prefix this user has
 * @prop {Boolean} spacedPrefix Whether this guild's prefix is spaced
 * @prop {Boolean} blacklisted Whether this guild is blacklisted
 */

/**
 * - An interface for guild entries, all methods except `update()` updates the data on this `UserEntry` instance, and convert the changes into MongoDB queries in the background
 * - The changes won't be saved unless `save()` is called
 * - If you want to return the updated data to the user, it is recommended to use the `UserEntry` instance returned by the `save()` method, as it is guaranteed to be what has been inserted into the database
 * - Changes directly done on `UserEntry.props` **won't be saved**, the `update()` method should be used for changes that aren't covered by the other methods
 * - While chaining calls is possible, chaining calls that update the same value (e.g: `addBank()` followed by `removeBank()`) won't work as intended, as the query for this field will be overwritten
 */
class GuildEntry {
    /**
   *
   * @param {GuildData} guildData The user entry
   * @param {Felix} client The Memer instance
   */
    constructor (guildData, client) {
        /** @type {GuildData} The entry's properties */
        this.props = { ...client.db.getDefaultGuild(guildData._id), ...guildData };
        this._client = client;
        this._changes = {};
        this._saved = 0;
    }

    /**
   * Manually update the guild entry with the given data, note that the changes won't be reflected in the object
   * @param {Object} object The data to update this guild with, mongodb operators such as `$set` must be guild in the object properties
   * @returns {GuildEntry} The guild entry, so calls can be chained
   */
    update (object) {
        if (typeof object !== 'object') {
            throw new Error('Expected "object" parameter to be an object');
        }
        this._changes = this._client.utils.deepMerge(this._changes, object);
        return this;
    }

    /**
     * Set a new prefix for this guild
     * @param {String} prefix The new prefix to set
     * @param {Boolean} [unspaced=false] Whether the new prefix should have a space at the end
     * @returns {GuildEntry} The guild entry, so calls can be chained
     * @memberof GuildEntry
     */
    changePrefix (prefix, unspaced = false) {
        if (typeof prefix !== "string") {
            throw new Error(`Expected type "string", received type ${typeof prefix}`);
        }
        this.props.prefix = prefix;
        this.props.spacedPrefix = unspaced ? false : true;
        this.update( { $set: { prefix, spacedPrefix: unspaced ? false : true } });
        return this;

    }

    /**
     * Resets the prefix of this guild
     * @returns {GuildEntry} The guild entry, so calls can be chained
     * @memberof GuildEntry
     */
    resetPrefix () {
        if (typeof prefix !== "string") {
            throw new Error(`Expected type "string", received type ${typeof prefix}`);
        }
        this.props.prefix = this._client.config.prefix;
        this.props.spacedPrefix = true;
        this.update( { $set: { prefix: this._client.config.prefix, spacedPrefix: true } });
        return this;

    }

    /**
     *
     * Get this guild's prefix, returns the default prefix if the guild has none
     * @readonly
     * @memberof GuildEntry
     * @returns {String} This guild's prefix
     */
    get prefix () {
        return this.props.prefix ? (this.props.spacedPrefix ? `${this.props.prefix} ` : this.props.prefix) : this._client.config.prefix;
    }

    /**
     * Blacklist this guild
     * @returns {GuildEntry} The guild entry, so calls can be chained
     * @memberof GuildEntry
     */
    blacklist () {
        this.props.blacklisted = true;
        this.update( { $set: { blacklisted: true } });
        return this;
    }

    /**
     * Unblacklist this guild
     * @returns {GuildEntry} The guild entry, so calls can be chained
     * @memberof GuildEntry
     */
    unBlacklist () {
        this.props.blacklisted = false;
        this.update( { $set: { blacklisted: false } });
        return this;
    }

    /**
   * Saves the user into the database
   * @returns {Promise<void>} The promise representation of the save command sent
   */
    async save () {
        return this._client.mongodb.collection('guilds').findOneAndUpdate({ _id: this.props._id }, this._changes, { upsert: true, returnOriginal: false })
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

module.exports = GuildEntry;