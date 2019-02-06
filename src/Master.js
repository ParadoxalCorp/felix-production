// @ts-nocheck
const Sharder = require('@eris-sharder/core/index');
const config = require('../config');
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

class Master extends Sharder {
    constructor() {
        super('instance-0', {
            token: config.token,
            sharding: {
                firstShardID: 0,
                shards: config.process.shards,
                guildsPerShard: config.process.guildsPerShard
            },
            clustering: {
                clusters: config.process.clusters
            }
        }, {});
        this.create().then(() => { this.init().then(() => {
            this.registry.registerWorker('instance-0', 1, 0).then(() => {});
        }); });
    }
}

module.exports = Master;