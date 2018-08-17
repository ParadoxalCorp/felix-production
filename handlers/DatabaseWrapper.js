'use strict';

/** @typedef {import("../main.js").Client} Client */

const { inspect } = require('util');
const TableInterface = require('../structures/HandlersStructures/TableInterface');
const ExtendedGuildEntry = require('../structures/ExtendedStructures/extendedGuildEntry');
const ExtendedUserEntry = require('../structures/ExtendedStructures/extendedUserEntry');

/**
 * @class DatabaseWrapper
 */
class DatabaseWrapper {
    /**
     * 
     * @param {Client} client - The client instance
     */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
        this.rethink = require("rethinkdbdash")({
            servers: [
                { host: client.config.database.host, port: client.config.database.port }
            ],
            silent: true,
            user: client.config.database.user,
            password: client.config.database.password,
            db: client.config.database.database
        });
        /** @type {Boolean} Whether the connection is in a healthy state */
        this.healthy = false;
        this.rethink.getPoolMaster().on('healthy', this._onHealthy.bind(this));
        this._initAttempts = 0;
        /** @type {TableInterface} */
        this.userData;
        /** @type {TableInterface} */
        this.guildData;
        this._init.bind(this)().catch(this._handleFailedInit.bind(this));
    }

    async _init() {
        if (this._initAttempts === 0) {
            this._initAttempts = 1;
        }
        const tableList = await this.rethink.tableList();
        const missingTables = ['guilds', 'users', 'stats', 'playlists'].filter(t => !tableList.includes(t));
        if (missingTables[0]) {
            return Promise.reject(new Error(`Couldn't initialize the database connection as the following tables are missing: ${missingTables.join(', ')}`));
        }
        this.userData = new TableInterface({
            client: this.client,
            rethink: this.rethink,
            tableName: 'users',
            extension: ExtendedUserEntry
        });
        this.guildData = new TableInterface({
            client: this.client,
            rethink: this.rethink,
            tableName: 'guilds',
            extension: ExtendedGuildEntry,
            finalCheck: (data) => {
                //4.2.10 Change: Add the possibility to set "incompatible" self-assignable roles
                //Requires to change the structure from an array containing strings (role ids) to objects (role ids + incompatible roles)
                data.selfAssignableRoles = data.selfAssignableRoles.map(selfAssignableRoles => {
                    if (typeof selfAssignableRoles === "string") {
                      return this.client.structures.References.selfAssignableRole(selfAssignableRoles);
                    }
                    return selfAssignableRoles;
                });
                return data;
            }
        });
        await Promise.all([this.guildData.table, this.userData.table]);
        this._initAttempts = 0;
        this.healthy = true;
        process.send({ name: 'info', msg: `The connection with the database at ${this.client.config.database.host}:${this.client.config.database.port} has been established` });
    }

    /**
     * Get a stored user from their ID
     * @param {String} id - The ID of the user to get
     * @returns {Promise<ExtendedUserEntry>} The stored user entry, or a new one
     */
    getUser(id) {
        return this.userData.get(id);
    }

    /**
     * Get a stored guild from its ID
     * @param {String} id - The ID of the guild to get
     * @returns {Promise<ExtendedGuildEntry>} The stored guild entry, or a new one
     */
    getGuild(id) {
        return this.guildData.get(id);
    }

    /**
     * 
     * @param {*} value - The value to insert, must contain a `id` property
     * @param {String} [type] - The type, or name of the table, can be omitted if the value is a Extended<...>Entry instance
     * @returns {Promise<*>} The value
     */
    set(value, type) {
        type = type ? type : (value instanceof ExtendedUserEntry ? 'users' : 'guilds');
        //users + user and guilds + guild to ensure backward compatibility 
        if (type === 'users' || type === 'user') {
            return this.userData.set(value);
        } else if (type === 'guilds' || type === 'guild') {
            return this.guildData.set(value);
        }
        return this.rethink.table(type).get(value.id).replace(value).run();
    }

    _onHealthy(healthy) {
        switch (healthy) {
            case true:
                process.send({ name: 'info', msg: `The connection with the database at ${this.client.config.database.host}:${this.client.config.database.port} has been established` });
                break;
            case false: 
                process.send({ name: 'warn', msg: 'The connection with the database has been closed, commands using the database will be disabled until a successful re-connection has been made' });
        }
        this.healthy = healthy;
    }

    _handleFailedInit(err) {
        const retryTimeout = (15000 * this._initAttempts) > 120000 ? 120000 : 15000 * this._initAttempts;
        process.send({ name: 'error', msg: `Database initialization failed: ${inspect(err)}\nRetrying in ${retryTimeout}ms`});
        setTimeout(() => {
            this._init().catch(this._handleFailedInit.bind(this));
        }, retryTimeout || 15000);
        this._initAttempts = this._initAttempts + 1;
    }

    _reload() {
        this.healthy = false;
        this.rethink.getPoolMaster().drain();
        delete require.cache[module.filename];
        delete require.cache[require.resolve('../structures/HandlersStructures/TableInterface')];
        delete require.cache[require.resolve('../utils/databaseUpdater')];
        this.userData = undefined;
        this.guildData = undefined;
        const updatedDatabaseWrapper = require(module.filename);
        return new updatedDatabaseWrapper(this.client);
    }
}

module.exports = DatabaseWrapper;