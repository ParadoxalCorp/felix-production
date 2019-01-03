const config = require('../config');
const { Client } = require('eris');

class Felix extends Client {
    constructor() {
        super(process.env.TOKEN, {
            firstShardID: Number(process.env.FIRST_SHARD_ID),
            lastShardID: Number(process.env.LAST_SHARD_ID)
        });
        this.config = config;
        this.launch();
    }

    async launch () {
        this.connect();
    }
}

module.exports = Felix;