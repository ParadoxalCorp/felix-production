/** 
 * @typedef {import('../Cluster')} Client
 * @typedef {import('mongoose')} Mongoose
 * @typedef {import('mongoose').Document} Document
*/

class DatabaseHandler {
    /**
     * @param {Client} client The client instance
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
        const userSchema = new this.client.db.Schema({
            _id: String,
            baguette: String
        });
        const guildSchema = new this.client.db.Schema({
            _id: String
        });
        this.models = {
            User: this.client.db.model('User', userSchema),
            Guild: this.client.db.model('Guild', guildSchema)
        };
        this._source = "DatabaseHandler";
    }

    /**
     * Connects to the database
     * @returns {Promise<Mongoose>} The mongoose instance
     * @memberof DatabaseHandler
     */
    connect () {
        return this.client.db.connect(this.client.config.database.dbURI, {
            keepAlive: true,
            useNewUrlParser: true
        });
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
    
    /**
     *
     *
     * @param {String} id The ID of the user to get
     * @returns {Promise<Document>} The user Document
     * @memberof DatabaseHandler
     */
    getUser (id) {
        return new Promise((resolve, reject) => {
            this.models.User.findById(id, (err, res) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(res ? res : new this.models.User({ _id: id, baguette: 'croissant' }));
                }
            });
        });
    }
}

module.exports = DatabaseHandler;