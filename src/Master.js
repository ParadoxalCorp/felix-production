// @ts-nocheck
const Sharder = require("@eris-sharder/core/index")
process.on("unhandledRejection", console.error)
process.on("uncaughtException", console.error)

class Master extends Sharder {
    constructor() {
        super(
            "instance-0",
            {
                token: process.env.DISCORD_TOKEN,
                sharding: {
                    firstShardID: 0,
                    shards: Number(process.env.PROCESS_SHARDS),
                    guildsPerShard: Number(process.env.PROCESS_GUILDSPERSHARDS)
                },
                clustering: {
                    clusters: Number(process.env.PROCESS_CUSTERS)
                }
            },
            {}
        )
        this.create().then(() => {
            this.init().then(() => {
                this.registry.registerWorker("instance-0", 1, 0).then(() => {})
            })
        })
    }
}

module.exports = Master
