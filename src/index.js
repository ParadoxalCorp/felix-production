const Sharder = require('@eris-sharder/core/index');
const master = require('cluster');
const config = require('../config');
const { Client } = require('eris');
const { Communication } = require('@eris-sharder/core/src');

if (master.isMaster) {
    let sharder = new Sharder('For the Motherland', {
        token: config.token,
        sharding: {
            firstShardID: 0,
            shards: 2
        },
        clustering: {
            clusters: 1
        }
    }, {});

    sharder.create().then(() => {
        sharder.init().then(() => {
        });
    });
} else {
    let ForTheMotherlands;
    process.on('message', async(msg) => {
        if (msg.event === 'connect') {
            let firstShardID = Number(process.env.FIRST_SHARD_ID);
            let lastShardID = Number(process.env.LAST_SHARD_ID);
            console.log(`Cluster ${process.env.CLUSTER_ID} | Shards ${firstShardID} - ${lastShardID} | Total: ${lastShardID - firstShardID + 1}`);
            process.send({
                event: 'cluster.connected',
                data: {
                    clusterID: process.env.CLUSTER_ID
                }
            });
            ForTheMotherlands = new Client(process.env.TOKEN, {
                firstShardID,
                lastShardID
            });
            await ForTheMotherlands.connect();
        }
    });
}