const { Client, Collection } = require("eris");
const { MongoClient: mongodb }  = require("mongodb");
const DatabaseHandler = require("./handlers/DatabaseHandler");
const ApiServer = require("./api")
const Logger = require("@eris-sharder/core/src/modules/Logger");
const { promises: fs } = require("fs");
const { join } = require("path");
const Utils = require("./structures/Utils");
const i18next = require("i18next");
const MessageCollector = require("./handlers/MessageCollector");
const sentry = require('@sentry/node');
sentry.configureScope((scope) => {
    scope.setTag("process", "worker")
        .setTag("environment", process.env.NODE_ENV)
        .setExtra("worker-id", process.env.CLUSTER_ID);
});
const captureError = (err) => {
    console.error(err);
    sentry.captureException(err);
};
process.on("uncaughtException", captureError);
process.on("unhandledRejection", captureError);

module.exports = class Bot$ extends Client {
    constructor() {
        super(process.env.TOKEN, {
            firstShardID: Number(process.env.FIRST_SHARD_ID),
            lastShardID: Number(process.env.LAST_SHARD_ID)
        });
        this.mongo = mongodb;
        /** @type {import('mongodb').Db} */
        this.mongodb;
        this.db = new DatabaseHandler(this);
        this.api = new ApiServer(this);
        this.logger = new Logger();
        this.commands = new Collection(undefined);
        this.aliases = new Collection(undefined);
        this.prefixes = process.env.PREFIX ? [process.env.PREFIX] : [];
        this.launch();
        this.i18n;
        this.messageCollector = new MessageCollector(this);
        this.sentry = sentry;
        this.events = {};
        this.utils = new Utils(this);
        this.models = require("./structures/models");
        this.structures = {
            Context: require("./structures/Context"),
            GuildEntry: require("./structures/GuildEntry"),
            UserEntry: require("./structures/UserEntry"),
            Command: require("./structures/Command"),
            Utils: require("./structures/Utils")
        };
    }

    async launch () {
        await this.logger.registerTransport("console", new (require("@eris-sharder/core/src/transports/Console"))());
        await this.loadEventsListeners();
        await this.loadCommands();
        this.i18n = await i18next.default.init({
            lng: "en-US",
            fallbackLng: "en-US",
            // @ts-ignore
            resources: await this.loadLanguages(),
            interpolation: {
                format: function(value, format, lng) {
                    switch (format) {
                    case "uppercase":
                        return value.toUpperCase();
                    case "capital":
                        if (value.charAt(0)) {
                            return value.charAt(0).toUpperCase() + value.slice(1);
                        }
                        return value;
                    case "lowercase":
                        return value.toLowerCase();
                    default:
                        return value;
                    }

                }
            }
        });
        this.connect();
        await this.logger.init();
        await this.db.connect();
        await this.api.start();
    }

    async loadEventsListeners() {
        //Load events
        const start = process.hrtime();
        const events = await fs.readdir(join(__dirname, "events"));
        let loadedEvents = 0;
        events.forEach(e => {
            try {
                const eventName = e.split(".")[0];
                const event = require(join(__dirname, "events", e));
                loadedEvents++;
                this.events[eventName] = event.handle.bind(event, this);
                this.on(eventName, this.events[eventName]);
                delete require.cache[require.resolve(join(__dirname, "events", e))];
            } catch (err) {
                this.logger.error({ src: process.env.CODENAME, msg: `Failed to load event ${e}: ${err.stack || err}` });
            }
        });
        const end = process.hrtime(start);
        this.logger.info({ src: process.env.CODENAME, msg: `Loaded ${loadedEvents}/${events.length} events (took ${end[1] / 1000000}ms)` });
        process.on("unhandledRejection", (err) => this.emit("error", err));
        process.on("uncaughtException", (err) => this.emit("error", err));
    }

    async loadCommands() {
        const start = process.hrtime();
        const categories = await fs.readdir(join(__dirname, "commands"));
        let totalCommands = 0;
        for (let i = 0; i < categories.length; i++) {
            let thisCommands = await fs.readdir(join(__dirname, "commands", categories[i]));
            totalCommands = totalCommands + thisCommands.length;
            thisCommands.forEach(c => {
                try {
                    let command = new (require(join(__dirname, "commands", categories[i], c)))(this);
                    //Add the command and its aliases to the collection
                    this.commands.set(command.name, command);
                    command.category = categories[i];
                    command.aliases.forEach(alias => {
                        this.aliases.set(alias, command.name);
                    });
                } catch (err) {
                    this.logger.error({ src: process.env.CODENAME, msg: `Failed to load command ${c}: ${err.stack || err}` });
                }
            });
        }
        const end = process.hrtime(start);
        this.logger.info({ src: process.env.CODENAME, msg: `Loaded ${this.commands.size}/${totalCommands} commands (took ${end[1] / 1000000}ms)` });
    }

    async loadLanguages() {
        const start = process.hrtime();
        const languagesFolder = await fs.readdir("./src/locales");
        let resources = {};
        for (const folder of languagesFolder) {
            resources[folder] = {
                translation: require(`./locales/${folder}/${folder}.json`)
            };
        }
        const end = process.hrtime(start);
        this.logger.info({ src: process.env.CODENAME, msg: `Loaded ${languagesFolder.length} language(s): ${languagesFolder.join(", ")} (took ${end[1] / 1000000}ms)` });
        return resources;
    }
}
