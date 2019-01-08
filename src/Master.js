const Sharder = require('@eris-sharder/core/index');
const config = require('../config');
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);
const mongoose = require('mongoose');

class Master extends Sharder {
    constructor() {
        super('For the Motherland', {
            token: config.token,
            sharding: {
                firstShardID: 0,
                shards: 2
            },
            clustering: {
                clusters: 2
            }
        }, {});
        this.create().then(() => { this.init().then(() => {}); });
    }
}

module.exports = Master;