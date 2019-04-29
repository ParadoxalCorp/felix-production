
/** 
 * @typedef {import('../Cluster')} Client
 * @typedef {import('mongodb')} Mongo
 * @typedef {import("../structures/GuildEntry").GuildData} GuildData
 * @typedef {import("../structures/UserEntry").UserData} UserData
*/

const UserEntry = require("../structures/UserEntry");
const GuildEntry = require("../structures/GuildEntry");

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
     * @returns {Promise<void>} The mongo instance
     * @memberof DatabaseHandler
     */
    async connect () {
        const client = await this.client.mongo.connect(process.env.DATABASE_URI, {
            autoReconnect: true,
            keepAlive: true,
            useNewUrlParser: true
        });
        this.client.mongodb = client.db("data");
        this._handleSuccessfulConnection();
    }
 
    _handleSuccessfulConnection () {
        if (this.client.logger.started) {
            // @ts-ignore
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
            this.client.logger.debug({ src: this._source, msg: "Connecting to the database..."});
        }
    }

    _handleDisconnection () {
        if (this.client.logger.started) {
            this.client.logger.debug({ src: this._source, msg: "Disconnecting from the database..."});
        }
    }
    
    /**
     * Get a user's database entry
     * @param {String} id The ID of the user to get
     * @returns {Promise<UserEntry>} The user entry
     * @memberof DatabaseHandler
     */
    async getUser (id) {
        const user = await this.client.mongodb.collection("users").findOne({ _id: id });
        if (user) {
            return new UserEntry(user, this.client);
        }
        else {
            await this.client.mongodb.collection("users").insertOne(this.getDefaultUser(id));
            return new UserEntry(this.getDefaultUser(id), this.client);
        }
    }

    /**
     * Get a guild's database entry
     * @param {string} id The ID of the guild to get
     * @returns {Promise<GuildEntry>} The guild entry
     * @memberof DatabaseHandler
     */
    async getGuild (id) {
        const user = await this.client.mongodb.collection("guilds").findOne({ _id: id });
        if (user) {
            return new GuildEntry(user, this.client);
        }
        else {
            await this.client.mongodb.collection("guilds").insertOne(this.getDefaultGuild(id));
            return new GuildEntry(this.getDefaultGuild(id), this.client);
        }
    }

    /**
     * @param {string} [id="1"] as
     * @memberof DatabaseHandler
     * @returns {UserData} defaultUser
     */
    getDefaultUser (id) {
        return {
            _id: id,
            coins: 0,
            lang: "en-US",
            blacklisted: false
        };
    }

    /**
     * @param {string} [id="1"] as
     * @memberof DatabaseHandler
     * @returns {GuildData} defaultGuild
     */
    getDefaultGuild (id="1") {
        return {
            _id: id,
            spacedPrefix: true,
            blacklisted: false,
            prefix: process.env.PREFIX,
            lang: "en-US",
            permissions: {
                users: [],
                roles: [],
                categories: [],
                channels: [],
                global: {
                    allowedCommands: [],
                    restrictedCommands: []
                }
            }
        };
    }
}

module.exports = DatabaseHandler;