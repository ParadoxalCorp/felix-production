/** @typedef {import("../main.js").Client} Client */

const fs = require('fs');
const { join } = require('path');
/** @typedef {import("../structures/Command.js")} Command */

/**
 * Provides methods to reload events listeners, modules and commands
 * @prop {Client} client - The client given in the constructor
 */
class Reloader {
    /**
     * @param {Client} client - The client instance 
     */
    constructor(client) {
        this.client = client;
    }

    /**
     * Reload the command at the given path, or add it if it wasn't already here
     * @param {string} path - The absolute path to the command
     * @returns {Command|Boolean} The reloaded command so calls can be chained, or true if all commands were reloaded
     */
    reloadCommand(path) {
        const reload = (commandPath) => {
            delete require.cache[commandPath];
            let command = require(commandPath);
            if (!command.help) {
                command = new command(this.client);
            }
            this.client.commands.set(command.help.name, command);
            this.client.aliases.filter(a => a === command.help.name).forEach(a => this.client.aliases.delete(a));
            command.conf.aliases.forEach(alias => this.client.aliases.set(alias, command.help.name));
    
            return command;
        };
        if (path === 'all') {
            for (const [key, value] of this.client.commands) {
                if (!value.conf.subCommand) {
                    reload(require.resolve(`../commands/${value.category.name.toLowerCase()}/${key}`));
                }
            }
            // @ts-ignore
            return true;
        }
        return reload(path);
    }

    /**
     * Reloads all commands
     * @returns {Command|Boolean} The reloaded command so calls can be chained, or true if all commands were reloaded
     */
    reloadCommands() {
        return this.reloadCommand("all");
    }

    /**
     * Reload the event listener at the given path, or add it if it wasn't already here
     * @param {string} path - The absolute path to the event listener
     * @returns {string | Boolean} The name of the event, parsed from the path
     */
    reloadEventListener(path) {
        if (path === 'all') {
            fs.readdir(join(process.cwd(), 'events'), (err, events) => {
                for (const event of events) {
                    const eventName = event.split(/\/|\\/gm)[path.split(/\/|\\/gm).length - 1].split('.')[0];
                    const eventPath = join(process.cwd(), 'events', event);
                    delete require.cache[eventPath];
                    this.client.bot.removeListener(eventName, this.client._boundEvents[eventName]);
                    this.client.bot.on(eventName, require(eventPath).handle.bind(require(eventPath), this.client));
                }
            });
            return true;
        }
        const eventName = path.split(/\/|\\/gm)[path.split(/\/|\\/gm).length - 1].split('.')[0];
        delete require.cache[path];
        this.client.bot.removeListener(eventName, this.client._boundEvents[eventName]);
        this.client.bot.on(eventName, require(path).handle.bind(require(path), this.client));
        return eventName;
    }

    /**
     * Reload the module at the given path, or add it if it wasn't already here
     * @param {string} path - The absolute path to the module
     * @param {string} name - The name of the module (file name)
     * @param {object} options - An object of options
     * @param {boolean|string} options.bindtoclient - Whether the module should be added as a property of the client class, can be true or a string which should be the name under which the module will go
     * @param {string} options.instantiate - Whether a non-instantiated class should be expected, "bot" will instantiate it with the eris bot class, "client" with the client instance
     * @returns {*} The reloaded module (and instantiated if needed), so calls can be chained
     */
    reloadModule(path, name, options) {
        if (path === 'all') {
            for (const path in require.cache) {
                const toIgnore = ['node_modules'];
                if (!toIgnore.find(f => path.includes(f))) {
                    delete require.cache[path];
                }
            }
            Object.assign(this.client, require('../index')(this.client));
            return true;
        }
        delete require.cache[path];

        // @ts-ignore
        if (this.client[typeof options['bindtoclient'] === 'string' ? options['bindtoclient'] : name]) {
            // @ts-ignore
            delete this.client[typeof options['bindtoclient'] === 'string' ? options['bindtoclient'] : name];
            options['bindtoclient'] = typeof options['bindtoclient'] === 'string' ? options['bindtoclient'] : name;
        }

        const actualModule = options['instantiate'] ? new(require(path))(options['instantiate'] === 'client' ?
            this.client : (options['instantiate'] === 'bot' ? this.client.bot : false)) : require(path);

        if (options['bindtoclient']) {
            // @ts-ignore
            this.client[typeof options['bindtoclient'] === 'string' ? options['bindtoclient'] : name] = actualModule;
        }

        return actualModule;
    }

    /**
     * Reloads all utils
     * @returns {Boolean} Returns true if the reload was a success
     */
    reloadUtils() {
        for (const util in this.client.utils) {
            delete require.cache[require.resolve(`../utils/${util}.js`)];
        }
        delete require.cache[require.resolve("../utils/index.js")];
        this.client.utils = require("../utils/index.js")(this.client);
        return true;
    }

    /**
     * Reloads all handlers
     * @returns {void}
     */
    reloadHandlers() {
        return this.client.initializeHandlers(true);
    }

    reloadStructures() {
        const folders = ['CommandCategories', 'Contexts', 'ExtendedStructures', 'HandlersStructures'];
        const files = fs.readdirSync(join(process.cwd(), 'structures'));
        function reloadFiles (filesToReload, path) {
            for (const file of filesToReload) {
                if (!folders.includes(file)) {
                    delete require.cache[path ? join(path, file) : require.resolve(`../structures/${file}`)];
                } else {
                    const folderPath = join(process.cwd(), 'structures', file);
                    reloadFiles(fs.readdirSync(folderPath), folderPath);
                }
            }
        }
        reloadFiles(files);
        this.client.structures = require('../structures/index.js');
    }
}

module.exports = Reloader;