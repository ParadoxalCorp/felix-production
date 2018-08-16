// @ts-nocheck
'use strict';

/** @typedef {import("../../main.js").Client} Client */

const { inspect } = require('util');
const Collection = require('../../utils/Collection');
const databaseUpdater = require('../../utils/databaseUpdater');
const references = require('../References');

class TableInterface {
    /**
     * @param {object} params - An object of parameters
     * @param {Client} params.client - The client instance
     * @param {object} params.rethink - The RethinkDB instance
     * @param {string} params.tableName - The name of the table to create an interface for
     * @param {object} params.extension - The extension class for the entries this table is supposed to contain
     * @param {function} params.initialCheck - A function that will be called with the `data` parameter before the databaseUpdater, specify one to manipulate the non-updated data
     * @param {function} params.finalCheck - A function that will be called with the `data`parameter after the databaseUpdater, specify one to manipulate the updated data 
     */
    constructor(params) {
        /** @type {Client} */
        this.client = params.client;
        this._rethink = params.rethink;
        this.table = this._init(params.tableName);
        this.changesStream;
        /** @type {Collection} The cache for this table */
        this.cache = new Collection();
        /** @type {String} The name of the table */
        this.tableName = params.tableName;
        this.extension = params.extension.bind(params.client);
        /** @type {Function} */
        this.initialCheck = params.initialCheck;
        /** @type {Function} */
        this.finalCheck = params.finalCheck;
        this._cacheDuration = 18e5;
        this._sweepInterval = setInterval(this._sweep.bind(this), this._cacheDuration);
    }

    /**
     * 
     * @param {String} tableName - The name of the table
     * @private
     * @returns {Promise<Object>} The RethinkDB table
     */
    async _init(tableName) {
        await this._rethink.table(tableName).changes({ squash: true, includeInitial: true, includeTypes: true }).run()
            .then(stream => {
                this.changesStream = stream;
                this.changesStream.on('data', this._cacheData.bind(this));
                this.changesStream.on('error', this._handleBrokenStream.bind(this));
            })
            .catch(err => {
                process.send({name: 'warn', msg: `Failed to establish the changes stream for the table ${tableName}: ${err}\nWill fallback to standard uncached requests`});
            });
        return 'ready';
    }

    /**
     * Set or update an entry in the database
     * @param {Object} data - The extended entry class or the raw data object to set
     * @returns {Promise<Object>} The updated data 
     */
    async set(data) {
        return this._rethink.table(this.tableName).get(data.id).replace(data.toDatabaseEntry ? data.toDatabaseEntry() : data, {returnChanges: 'always'}).run()
            .then(() => {
                this.cache.set(data.id, data);
            });
    }

    /**
     * Get a stored value in the table from its key
     * @param {String|Number} key - The key of the stored value to get
     * @returns {Promise<Object>} The stored value, or a new entry 
     */
    async get(key) {
        const update = (data) => {
            data = this.initialCheck ? this.initialCheck(data) : data;
            data = databaseUpdater(data, this.tableName === 'guilds' ? 'guild' : 'user');
            return this.finalCheck ? this.finalCheck(data) : data;
        };
        if (this.cache.has(key)) {
            let cachedValue = this.cache.get(key);
            cachedValue._lastRequestedAt = Date.now();
            cachedValue = new this.extension(update(cachedValue), this.client);
            return cachedValue;
        }
        if (!this.client.handlers.DatabaseWrapper.healthy) {
            return null;
        }
        return this._rethink.table(this.tableName).get(key).run()
            .then(data => data ? new this.extension(update(data), this.client) : new this.extension(references[this.tableName === 'guilds' ? 'guildEntry' : 'userEntry'](key), this.client));
    }

    /**
     * Cache received data from the changes stream
     * @param {object} data - The data
     * @returns {void} 
     */
    _cacheData(data) {
        if (data.type === "remove") {
            return this.cache.delete(data.new_val.id);
        }
        this.cache.set(data.new_val.id, data.new_val);
    }

    async _handleBrokenStream(err) {
        this.client.handlers.DatabaseWrapper.healthy = false;
        this.client.bot.emit('error', inspect(err));
        const testQuery = await this._rethink.table(this.tableName).get('test').run().catch(() => false);
        if (!testQuery) {
            return;
        }
        this.client.handlers.DatabaseWrapper.healthy = true;
        process.send({name: 'warn', msg: `Changes stream for the table ${this.tableName} is broken but the table can still be used`});
    }

    _sweep() {
        let clearedEntries = 0;
        switch (this.tableName) {
            case 'users':
                for (let [key, value] of this.cache) {
                    if (!value._lastRequestedAt || (value._lastRequestedAt < (Date.now() - this._cacheDuration))) {
                        this.cache.delete(key);
                        clearedEntries++;
                    }
                }
                break;
            case 'guilds':
                for (let [key] of this.cache) {
                    //Remove from the cache guilds that aren't in this cluster
                    if (!this.client.bot.guilds.has(key)) {
                        this.cache.delete(key);
                        clearedEntries++;
                    }
                }
                break;
        }
        process.send({name: 'info', msg: `[TableInterface:${this.tableName}] Cache sweep done, cleared ${clearedEntries} ${this.tableName}`});
    }
}

module.exports = TableInterface;