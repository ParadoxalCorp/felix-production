'use strict';

/** 
 * @typedef {import("eris").Client} ErisClient 
 * 
*/

const fs = require('fs');
const { join } = require('path');
const { Base } = require('eris-sharder');
const config = require('./config');

/**
 * @typedef {Object} BaseClient 
 * @prop {Boolean} maintenance A boolean representing whether the bot is in maintenance, if true, the bot should be unresponsive to anyone who isn't specified as admin in the config
 * @prop {import("./util/modules/collection.js")} collection Discord.js's collections
 * @prop {config} config The config file
 * @prop {Object} package This projects's package.json
 * @prop {Array<string>} prefixes An array of prefixes the bot listens to
 * @prop {import("./util/helpers/modules/IPCHandler.js").ClientStats} stats
 * @prop {import("./util/helpers/modules/utils.js")} utils 
 * @prop {Object} packages A name:package set, the point of this is very limited, kek.
 * @prop {Boolean} launchedOnce Whether the bot has already been launched
 * @prop {ErisClient} bot The eris client instance
 */

/** @typedef {BaseClient & import("./structures/index.js").Structures & import("./util/index.js").Utils} Client */

/**
 *
 * 
 * @class Felix
 * @extends {Base}
 */
class Felix extends Base {
    /** 
     * @param {Client} bot Eris Client 
     * @constructor Felix
    */
    constructor(bot) {
        super(bot);
        /** If true, this would ignore all messages from everyone besides the owner */
        this.maintenance = false;
        this.collection = require('./util/modules/collection');
        this.config = config;
        // @ts-ignore
        this.package = require('./package');
        this.prefixes = this.config.prefix ? [this.config.prefix] : [];
        this.stats;
        /** @type {import("./structures/index.js")} */
        this.structures = require('./structures/index.js');
        /** @type {import("./util/helpers/modules/utils.js")} */
        this.utils = new(require('./util/helpers/modules/utils'))(this);
        /** @type {Object} */
        this.packages = {};
        this.launchedOnce = false;
    }

    launch() {
        //Assign modules to the client
        Object.assign(this, require('./util')(this));
        this.ratelimited = new this.collection();
        //This will be filled with mentions prefix once ready
        this.commands = new this.collection();
        this.aliases = new this.collection();
        this.bot.on('ready', this.ready.bind(this));
        process.on('beforeExit', this.beforeExit.bind(this));
        process.on('SIGINT', this.beforeExit.bind(this));
        this.loadCommands();
        this.loadEventsListeners();
        this.verifyPackages();
        if (this.config.apiKeys['weebSH'] && this.packages.taihou) {
            this.weebSH = new (require('taihou'))(this.config.apiKeys['weebSH'], false, {
                userAgent: `Felix/${this.package.version}/${this.config.process.environment}`,
                toph: {
                    nsfw: false
                }
            });
        }

        this.ready();
    }

    loadCommands() {

        const categories = fs.readdirSync(join(__dirname, 'commands'));
        let totalCommands = 0;
        for (let i = 0; i < categories.length; i++) {
            let thisCommands = fs.readdirSync(join(__dirname, 'commands', categories[i]));
            totalCommands = totalCommands + thisCommands.length;
            thisCommands.forEach(c => {
                try {
                    let command = require(join(__dirname, 'commands', categories[i], c));
                    //Temporary code to make both the new and old commands structure cohabit 
                    if (!command.help) {
                        command = new command(this);
                    }
                    //Add the command and its aliases to the collection
                    if (!this.database && command.conf.requireDB) {
                        command.conf.disabled = 'This command require the database, however the database seems unavailable at the moment';
                    }
                    this.commands.set(command.help.name, command);
                    command.conf.aliases.forEach(alias => {
                        this.aliases.set(alias, command.help.name);
                    });
                } catch (err) {
                    this.log.error(`Failed to load command ${c}: ${err.stack || err}`);
                }
            });
        }
        this.log.info(`Loaded ${this.commands.size}/${totalCommands} commands`);
    }

    loadEventsListeners() {
        //Load events
        const events = fs.readdirSync(join(__dirname, 'events'));
        let loadedEvents = 0;
        events.forEach(e => {
            try {
                const eventName = e.split(".")[0];
                const event = require(join(__dirname, 'events', e));
                loadedEvents++;
                this.bot.on(eventName, event.handle.bind(event, this));
                delete require.cache[require.resolve(join(__dirname, 'events', e))];
            } catch (err) {
                this.log.error(`Failed to load event ${e}: ${err.stack || err}`);
            }
        });
        this.log.info(`Loaded ${loadedEvents}/${events.length} events`);
        process.on('unhandledRejection', (err) => this.bot.emit('error', err));
        process.on('uncaughtException', (err) => this.bot.emit('error', err));
    }

    async ready() {
        process.send({ name: 'info', msg: 'Ready got emitted' });
        //This code is only meant to be executed on launch, and not every time ready is emitted
        if (this.launchedOnce) {
            return;
        } else {
            this.launchedOnce = true;
        }
        if (!this.bot.user.bot) {
            this.log.error(`Invalid login details were provided, the process will exit`);
            process.exit(0);
        }
        if (this.weebSH) {
            const generate = async () => {
                return this.imageHandler.generateSubCommands()
                    .then(generated => {
                        process.send({ name: 'info', msg: `Generated ${generated} image sub-commands` });
                    })
                    .catch(err => {
                        process.send({ name: 'error', msg: `Failed to generate image sub-commands: ${err.stack || err}` });
                    });
            };
            await generate();
            this._imageTypesInterval = setInterval(generate, this.config.options.imageTypesInterval);
        }
        this.verifyMusic();
        this.prefixes.push(`<@!${this.bot.user.id}>`, `<@${this.bot.user.id}>`);
        process.send({ name: "info", msg: `Logged in as ${this.bot.user.username}#${this.bot.user.discriminator}, running Felix ${this.package.version}` });
        this.bot.shards.forEach(s => {
            s.editStatus("online", {
                name: `@${this.bot.user.username}#${this.bot.user.discriminator} help for commands | Shard ${s.id}`
            });
        });
    }

    verifyPackages() {
        const verifyRequirements = (command) => {
            for (const requirement of command.conf.require) {
                if (typeof this.config.apiKeys[requirement] !== 'undefined') {
                    if (!this.config.apiKeys[requirement]) {
                        if (this.config.removeDisabledCommands) {
                            this.commands.delete(command.help.name);
                        } else {
                            command.conf.disabled = `This command requires the \`${requirement}\` API key, but it is missing`;
                        }
                        process.send({ name: 'warn', msg: `${this.config.removeDisabledCommands ? 'Removed' : 'Disabled'} the command ${command.help.name} because the ${requirement} API key is missing` });
                    }
                } else {
                    if (!this.moduleIsInstalled(requirement)) {
                        if (this.config.removeDisabledCommands) {
                            this.commands.delete(command.help.name);
                        } else {
                            command.conf.disabled = `This command requires the \`${requirement}\` package, but it is missing`;
                        }
                        process.send({ name: 'warn', msg: `${this.config.removeDisabledCommands ? 'Removed' : 'Disabled'} the command ${command.help.name} because the ${requirement} package is missing` });
                    } else {
                        this.packages[requirement] = require(requirement);
                    }
                }
            }
        };

        //eslint-disable-next-line no-unused-vars
        for (const [key, value] of this.commands) {
            if (value.conf.require && value.conf.require[0]) {
                verifyRequirements(value);
            }
        }
    }

    verifyMusic() {
        if (!this.config.options.music.enabled) {
            if (this.config.removeDisabledCommands) {
                this.commands.filter(c => c.help.category === 'music').forEach(c => this.commands.delete(c.help.name));
            } else {
                this.commands.filter(c => c.help.category === 'music').forEach(c => this.commands.get(c.help.name).conf.disabled === `This command requires the music to be enabled`);
            }
            return process.send({ name: 'warn', msg: `${this.config.removeDisabledCommands ? 'Removed' : 'Disabled'} the music commands because config.options.music.enabled is set to false` });
        }
        if (!this.moduleIsInstalled('eris-lavalink')) {
            if (this.config.removeDisabledCommands) {
                this.commands.filter(c => c.help.category === 'music').forEach(c => this.commands.delete(c.help.name));
            } else {
                this.commands.filter(c => c.help.category === 'music').forEach(c => this.commands.get(c.help.name).conf.disabled === `This command require the \`eris-lavalink\` package which is missing`);
            }
            return process.send({ name: 'warn', msg: `${this.config.removeDisabledCommands ? 'Removed' : 'Disabled'} the music commands because the \`eris-lavalink\` package is missing` });
        }
        this.musicManager.init();
    }

    async beforeExit() {
        process.send({ name: 'warn', msg: `Exit process engaged, finishing the ongoing tasks..` });
        if (this.redis && this.redis.healthy) {
            await this.redis.quit();
            process.send({ name: 'info', msg: `Finished the ongoing tasks and closed the Redis connection` });
        }
        if (this.musicManager) {
            let lavalinkExit = this.musicManager.disconnect();
            if (lavalinkExit !== false) {
                process.send({ name: 'info', msg: `Sent exit code to the Lavalink server` });
            }
        }
        if (this.database && this.database.healthy) {
            this.database.rethink.getPoolMaster().drain();
            process.send({ name: 'info', msg: `Finished the ongoing tasks and closed the RethinkDB connection` });
        }
        process.send({ name: 'warn', msg: `All ongoing tasks finished, exiting..` });
    }
}

module.exports = Felix;