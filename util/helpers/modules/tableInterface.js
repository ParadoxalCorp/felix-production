// @ts-nocheck
'use strict';

/** @typedef {import("../../../main.js")} Client */

const { inspect } = require('util');
const Collection = require('../../modules/collection');
const databaseUpdater = require('./databaseUpdater');
const references = require('../data/references');

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
        this.client = params.client;
        this._rethink = params.rethink;
        this.table = this._init(params.tableName);
        this.changesStream;
        this.cache = new Collection();
        this.tableName = params.tableName;
        this.extension = params.extension.bind(params.client);
        this.initialCheck = params.initialCheck;
        this.finalCheck = params.finalCheck;
    }

    /**
     * 
     * @param {string} tableName - The name of the table
     * @private
     * @returns {Promise<object>} The RethinkDB table
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
     * @param {object} data - The extended entry class or the raw data object to set
     * @returns {Promise<any>} The updated data 
     */
    async set(data) {
        return this._rethink.table(this.tableName).get(data.id).replace(data.toDatabaseEntry ? data.toDatabaseEntry() : data, {returnChanges: 'always'}).run()
            .then(() => {
                this.cache.set(data.id, data);
            });
    }

    /**
     * Get a stored value in the table from its key
     * @param {string|number} key - The key of the stored value to get
     * @returns {Promise<any>} The stored value, or null if none are found
     */
    async get(key) {
        const update = (data) => {
            data = this.initialCheck ? this.initialCheck(data) : data;
            data = databaseUpdater(data, this.tableName === 'guilds' ? 'guild' : 'user');
            return this.finalCheck ? this.finalCheck(data) : data;
        };
        if (this.cache.has(key)) {
            return new this.extension(update(this.cache.get(key)), this.client);
        }
        if (!this.client.database.healthy) {
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
        this.client.database.healthy = false;
        this.client.bot.emit('error', inspect(err));
        const testQuery = await this._rethink.table(this.tableName).get('test').run().catch(() => false);
        if (!testQuery) {
            return;
        }
        this.client.database.healthy = true;
        process.send({name: 'warn', msg: `Changes stream for the table ${this.tableName} is broken but the table can still be used`});
    }
}

module.exports = TableInterface;