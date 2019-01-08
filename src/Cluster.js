const config = require('../config');
const { Client } = require('eris');
const mongoose = require('mongoose');
const DatabaseHandler = require('./handlers/DatabaseHandler');
const Logger = require('@eris-sharder/core/src/modules/Logger');
class Felix extends Client {
    constructor() {
        super(process.env.TOKEN, {
            firstShardID: Number(process.env.FIRST_SHARD_ID),
            lastShardID: Number(process.env.LAST_SHARD_ID)
        });
        this.config = config;        
        this.db = mongoose;
        this.dbHandler = new DatabaseHandler(this);
        this.logger = new Logger();
        this.logger.registerTransport('console', require('@eris-sharder/core/src/transports/Console'));
        this.launch();
    }

    async launch () {
        this.connect();
        await this.logger.init();
        mongoose.connect(`mongodb://${config.database.host}:${config.database.port}`, {
            dbName: config.database.database
        });
    }
}

module.exports = Felix;