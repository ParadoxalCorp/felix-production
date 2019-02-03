const Sharder = require('./src/Master');
const master = require('cluster');
const Cluster = require('./src/Cluster');
let sharder;
let cluster;

if (master.isMaster) {
    sharder = new Sharder();
} else {
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
            cluster = new Cluster();    
        }
    });
}