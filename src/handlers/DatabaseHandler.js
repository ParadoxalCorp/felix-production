/** @typedef {import('mongoose')} mongoose 
 * @typedef {import('../Cluster')} Client
*/

class DatabaseHandler {
    /**
     * 
     * @param {Client} client
     */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
        this.listeners = {
            open: this._handleSuccessfulConnection.bind(this),
            error: this._handleFailedConnection.bind(this),
            connecting: this._handleConnection.bind(this),
            disconnecting: this._handleDisconnection.bind(this)
        };
        for (const listener in this.listeners) {
            this.client.db.connection.on(listener, this.listeners[listener]);
        }
        this.models = {};
        this._source = "DatabaseHandler";
    }

    init () {
        const userSchema = new this.client.db.Schema({
            id: String
        });
        const guildSchema = new this.client.db.Schema({
            id: String
        });
        this.models.User = this.client.db.model('User', userSchema);
        this.models.Guild = this.client.db.model('Guild', guildSchema);

    }

    _handleSuccessfulConnection () {
        if (this.client.logger.started) {
            this.client.logger.info({ src: this._source, msg: `Successfully connected to the database at ${this.client.db.connection.host}:${this.client.db.connection.port}`});
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
}

module.exports = DatabaseHandler;