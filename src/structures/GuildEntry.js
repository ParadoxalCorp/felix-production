/** 
 * @typedef {import("../Cluster")} Felix 
 * @typedef {import("./Command")} Command
 * @typedef {import("eris").TextChannel} TextChannel
 * @typedef {import("./models").Permissions} Permissions
*/

/** 
 * @typedef {Object} GuildData
 * @prop {String} _id The ID of the user
 * @prop {String} [prefix] The prefix this user has
 * @prop {Boolean} spacedPrefix Whether this guild's prefix is spaced
 * @prop {Boolean} blacklisted Whether this guild is blacklisted
 * @prop {String} lang The language set for this guild
 * @prop {Object} permissions The permissions for this server
 * @prop {Array<Permissions>} permissions.users The permissions for the users on this server
 * @prop {Array<Permissions>} permissions.channels The permissions for the channels on this server
 * @prop {Array<Permissions>} permissions.roles The permissions for the roles on this server
 * @prop {Array<Permissions>} permissions.categories The permissions for the categories on this server
 * @prop {Permissions} permissions.global The permissions globally set on this server
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
        if (typeof object !== "object") {
            throw new Error("Expected \"object\" parameter to be an object");
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
        if (typeof this.prefix !== "string") {
            throw new Error(`Expected type "string", received type ${typeof this.prefix}`);
        }
        this.props.prefix = process.env.PREFIX;
        this.props.spacedPrefix = true;
        this.update( { $set: { prefix: process.env.PREFIX, spacedPrefix: true } });
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
        return this.props.prefix ? (this.props.spacedPrefix ? `${this.props.prefix} ` : this.props.prefix) : process.env.PREFIX;
    }

    /**
     * Check if the specified member has the permission to run the given command
     * @param {String} memberID - The member ID to check if they have the permission to run the specified command
     * @param {Command} command - The command
     * @param {TextChannel} channel - The channel in which the command is attempted to be used
     * @returns {Boolean} Whether or not the specified member is allowed to use the given command
     */
    memberHasPermission(memberID, command, channel) {
        let allowed;
        const member = this._client.guilds.get(this.props._id).members.get(memberID);
        //Filter the user roles that aren't in the database, sort them by position and finally map them to iterate through them later
        const rolesInDB = member.roles.filter(role => this.props.permissions.roles.find(r => r.id === role)).sort((a, b) => member.guild.roles.get(a).position -
            member.guild.roles.get(b).position).map(r => { return { name: "roles", id: r }; });
        [
            { name: this._client.models.defaultPermissions, id: undefined }, 
            { name: "global", id: undefined }, 
            { name: "categories", id: channel.parentID }, 
            { name: "channels", id: channel.id }, 
            ...rolesInDB, 
            { name: "users", id: member.id }
        ].forEach(val => {
            if (this.getPrioritaryPermission(val.name, command, val.id) !== undefined) {
                allowed = this.getPrioritaryPermission(val.name, command, val.id);
            }
        });
        if (member.permission.has("administrator")) {
            allowed = true;
        }
        if (command.hidden) {
            allowed = process.env.ADMINS.includes(member.id);
        }

        return allowed;
    }

    /**
     * Get the prioritary permission of a target and check if they are allowed to use the given command
     * @param {String|Array|Permissions} target - The name of the permissions to check ("channels", "roles", "users"..) OR an array/object following the exact same structure than the rest
     * @param {Command} command - The command
     * @param {String} [targetID] - Optional, the ID of the target to get the prioritary permission for
     * @returns {Boolean} Whether or not the target is allowed to use the command
     */
    getPrioritaryPermission(target, command, targetID) {
        let targetPos;
        if (typeof target !== "string") {
            if (Array.isArray(target)) {
                targetPos = target.find(t => t.id === targetID);
            } else {
                targetPos = target;
            }
        } else {
            if (Array.isArray(this.props.permissions[target])) {
                targetPos = this.props.permissions[target].find(t => t.id === targetID);
            } else {
                targetPos = this.props.permissions[target];
            }
        }
        let isAllowed;
        if (!targetPos) {
            return undefined;
        }
        //Give priority to commands over categories by checking them after the categories
        let priorityOrder = ["*", `${(command.category || command.category.toLowerCase())}*`, command.name];
        for (const permission of priorityOrder) {
            if (targetPos.allowedCommands.includes(permission)) {
                isAllowed = true;
            } else if (targetPos.restrictedCommands.includes(permission)) {
                isAllowed = false;
            }
        }
        return isAllowed;
    }

    /**
     * Clear the permissions of this guild
     * @returns {GuildEntry} The guild entry, so calls can be chained
     * @memberof GuildEntry
     */
    clearPermissions () {
        const defaultPerms = this._client.db.getDefaultGuild().permissions;
        this.props.permissions = defaultPerms;
        this.update({ $set: { permissions: defaultPerms } });
        return this;
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
        const res = await this._client.mongodb.collection("guilds").findOneAndUpdate({ _id: this.props._id }, this._changes, { upsert: true, returnOriginal: false });
        this._saved = this._saved + 1;
        this.props = res.value;
        this._changes = {};
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