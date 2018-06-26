'use strict';

const config = require('./config');
const { Master: Sharder } = require('eris-sharder');
const axios = require('axios');
const log = require('./util/modules/log');
const r = process.argv.includes('--no-db') ? false : require('rethinkdbdash')({
    servers: [
        { host: config.database.host, port: config.database.port }
    ],
    silent: true,
    log: (message) => {
        log.info(message);
    }
});

process.on('beforeExit', () => {
    setTimeout(() => {
        process.exit();
    }, 10000);
});
process.on('SIGINT', () => {
    setTimeout(() => {
        process.exit();
    }, 10000);
});

const master = new Sharder(config.token, '/main.js', {
    stats: true,
    name: 'Felix',
    clientOptions: {
        disableEvents: {
            TYPING_START: true
        },
        messageLimit: 25,
        defaultImageSize: 1024,
    },
    guildsPerShards: config.process.guildsPerShards,
    debug: config.process.debug,
    shards: config.process.shards,
    clusters: config.process.clusters
});

master.on('stats', res => {
    if (r) {
        r.db(config.database.database).table('stats')
            .insert({ id: 1, stats: res }, { conflict: 'update' })
            .run();
    }

    master.broadcast(1, { type: 'statsUpdate', data: res });
});

if (require('cluster').isMaster) {
    if (r) {
        const postGuilds = async() => {
            const { stats: { guilds } } = await r.db(config.database.database).table('stats')
                .get(1);

            for (const botList in config.botLists) {
                if (config.botLists[botList].token) {
                    axios({
                        method: 'post',
                        url: config.botLists[botList].url,
                        data: { server_count: guilds },
                        headers: { 'Authorization': config.botLists[botList].token, 'Content-Type': 'application/json' },
                        timeout: 15000
                    }).then(() => {
                        log.info(`Successfully posted guild stats to ${botList}`);
                    }).catch(err => {
                        log.error(`Failed to post guild stats to ${botList}: ${err}`);
                    });
                }
            }
        };
        setTimeout(postGuilds, 180000);
        setInterval(postGuilds, 3600000);
    }
}
