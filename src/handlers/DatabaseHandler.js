// @ts-nocheck
/** 
 * @typedef {import('../Cluster')} Client
 * @typedef {import('mongoose')} Mongoose
 * @typedef {import('mongoose').Document} Document
*/

const UserEntry = require('../structures/UserEntry');
const GuildEntry = require('../structures/GuildEntry');

class DatabaseHandler {
    /**
     * @param {Client} client The client instance
     */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
        this._source = "DatabaseHandler";
    }

    /**
     * Connects to the database
     * @returns {Promise<Mongoose>} The mongoose instance
     * @memberof DatabaseHandler
     */
    connect () {
        return this.client.mongo.connect(this.client.config.database.dbURI, {
            keepAlive: true,
            useNewUrlParser: true
        }).then((client) => {
            this.client.mongodb = client.db('data');
            this._handleSuccessfulConnection();
        });
    }

    _handleSuccessfulConnection () {
        if (this.client.logger.started) {
            this.client.logger.info({ src: this._source, msg: `Successfully connected to the database at ${this.client.mongo.connection.host}:${this.client.mongo.connection.port}`});
        }
    }

    _handleFailedConnection (err) {
        if (this.client.logger.started) {
            this.client.logger.error({ src: this._source, msg: `Failed to connect to the database: ${err}`});
        }
    }

    _handleConnection () {
        if (this.client.logger.started) {
            this.client.logger.debug({ src: this._source, msg: `Connecting to the database...`});
        }
    }

    _handleDisconnection () {
        if (this.client.logger.started) {
            this.client.logger.debug({ src: this._source, msg: `Disconnecting from the database...`});
        }
    }
    
    /**
     * Get a user's database entry
     * @param {String} id The ID of the user to get
     * @returns {Promise<UserEntry>} The user entry
     * @memberof DatabaseHandler
     */
    async getUser (id) {
        return this.client.mongodb.collection('users').findOne({ _id: id }).then(async(user) => {
            if (user) {
                return new UserEntry(user, this.client);
            } else {
                await this.client.mongodb.collection('users').insertOne(this.getDefaultUser(id));
                return new UserEntry(this.getDefaultUser(id), this.client);
            }
        });
    }

    /**
     * Get a guild's database entry
     * @param {String} id The ID of the guild to get
     * @returns {Promise<GuildEntry>} The guild entry
     * @memberof DatabaseHandler
     */
    async getGuild (id) {
        return this.client.mongodb.collection('guilds').findOne({ _id: id }).then(async(user) => {
            if (user) {
                return new GuildEntry(user, this.client);
            } else {
                await this.client.mongodb.collection('guilds').insertOne(this.getDefaultUser(id));
                return new GuildEntry(this.getDefaultUser(id), this.client);
            }
        });
    }

    getDefaultUser (id) {
        return {
            _id: id,
            coins: 0
        };
    }
}

module.exports = DatabaseHandler;