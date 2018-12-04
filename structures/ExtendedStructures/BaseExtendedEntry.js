/** @typedef {import("../../main").Client} Client
 * @typedef {import("../References").UserEntry} UserEntry
 * @typedef {import("../References").GuildEntry} GuildEntry
 */

class BaseExtendedEntry {
    /**
     *Creates an instance of BaseExtendedEntry.
     * @param {Client} client - The client instance
     * @memberof BaseExtendedEntry
     */
    constructor(client) {
        /** @type {Client} The client instance */
        this.client = client;
    }

    /**
     * Return this without the additional methods, essentially returns a proper database entry, ready to be saved into the database
     * Note that this shouldn't be called before saving it into the database, as the database wrapper already does it
     * @returns {GuildEntry | UserEntry} - This, as a proper database entry object (without the additional methods)
     */
    toDatabaseEntry() {
        const cleanObject = (() => {
            const newObject = {};
            for (const key in this) {
                if (typeof this[key] !== 'function' && key !== 'client') {
                    newObject[key] = this[key];
                }
            }
            return newObject;
        })();
        return cleanObject;
    }
}

module.exports = BaseExtendedEntry;