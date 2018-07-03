'use strict';

const Collection = require('../../modules/collection');
const databaseUpdater = require('./databaseUpdater');
const references = require('../data/references');

class TableInterface {
    /**
     * @param {object} params - An object of parameters
     * @param {object} params.client - The client instance
     * @param {object} params.rethink - The RethinkDB instance
     * @param {string} params.tableName - The name of the table to create an interface for
     * @param {object} params.extension - The extension class for the entries this table is supposed to contain
     * @param {function} params.initialCheck - A function that will be called with the `data` parameter before the databaseUpdater, specify one to manipulate the non-updated data
     * @param {function} params.finalCheck - A function that will be called with the `data`parameter after the databaseUpdater, specify one to manipulate the updated data 
     * @returns {TableInterface} A TableInterface instance
     */
    constructor(params) {
        this.client = params.client;
        this._rethink = params.rethink;
        this.table = new Promise((resolve, reject) => this._init(resolve, reject, params.tableName));
        this.changesStream;
        this.cache = new Collection();
        this.tableName = params.tableName;
        this.extension = params.extension.bind(params.client);
        this.initialCheck = params.initialCheck;
        this.finalCheck = params.finalCheck;
    }

    /**
     * 
     * @param {function} resolve - The function to resolve the promise
     * @param {function} reject - The function to reject the promise
     * @param {string} tableName - The name of the table
     * @private
     * @returns {Promise<object>} The RethinkDB table
     */
    async _init(resolve, reject, tableName) {
        await this._rethink.table(tableName)
            .catch(reject)
            .then(resolve);
        if (this.table.get) {
            await this.table.changes({ squash: true, includeInitial: true, includeTypes: true }).run()
                .then(stream => {
                    this.changesStream = stream;
                    this.changesStream.on('data', this._cacheData.bind(this));
                })
                .catch(err => {
                    process.send({name: 'warn', msg: `Failed to establish the changes stream for the table ${tableName}: ${err}\nWill fallback to standard uncached requests`});
                });
        }
    }

    /**
     * Set or update an entry in the database
     * @param {object} data - The extended entry class or the raw data object to set
     * @returns {Promise<data>} The updated data 
     */
    async set(data) {
        return this.table.get(data.id).replace(data.toDatabaseEntry ? data.toDatabaseEntry() : data, {returnChanges: 'always'});
    }

    async get(key) {
        const update = (data) => {
            data = this.initialCheck ? this.initialCheck(data) : data;
            data = databaseUpdater(data, this.tableName === 'guilds' ? 'guild' : 'user');
            return this.finalCheck ? this.finalCheck(data) : data;
        };
        if (this.cache.has(key)) {
            return new this.extension(update(this.cache.get(key)));
        }
        return this.table.get(key).run()
            .then(data => data ? new this.extension(update(data)) : new this.extension(references[this.tableName === 'guilds' ? 'guildEntry' : 'userEntry'](key)));
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

    
}

module.exports = TableInterface;