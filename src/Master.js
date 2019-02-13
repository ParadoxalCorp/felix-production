// @ts-nocheck
const Sharder = require("@eris-sharder/core/index");
const sentry = require('@sentry/node');
sentry.configureScope((scope) => {
    scope.setTag("process", "master")
        .setTag("environment", process.env.NODE_ENV)
        .setExtra("instance", 0);
});
const captureError = (err) => {
    console.error(err);
    sentry.captureException(err);
};
process.on("unhandledRejection", captureError);
process.on("uncaughtException", captureError);

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
            });
        });
    }
}

module.exports = Master;
