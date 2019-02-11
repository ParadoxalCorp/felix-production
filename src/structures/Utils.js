
/** 
 * @typedef {import("../Cluster")} Client 
 * @typedef {import("eris").Message} Message
 * @typedef {import("../structures/UserEntry")} UserEntry
 * @typedef {import("../structures/GuildEntry")} GuildEntry
 * @typedef {import("../structures/Command")} Command
*/

module.exports = class Utils {
    /**
     * Creates an instance of Utils.
     * @param {Client} client The client instance
     */
    constructor(client) {
        this.client = client;
    }

    /**
   * Performs a deep merge of the two given object, the behavior of this merge being the same as RethinkDB's `update`/`merge` methods
   * @param {Object} target - The object that should be updated with the source
   * @param {Object} source - The object that will be merged on the `target` object
   * @returns {Object} The merged object
   */
    deepMerge (target, source) {
        let destination = {};
        for (const key of Object.keys(target)) {
            destination[key] = (typeof target[key] === "object" && !Array.isArray(target[key])) ? { ...target[key] } : target[key];
        }

        for (const key of Object.keys(source)) {
            if (!target[key] || typeof target[key] !== "object" || Array.isArray(source[key])) {
                destination[key] = source[key];
            } else {
                if (typeof source[key] !== "object") {
                    destination[key] = source[key];
                } else {
                    destination[key] = this.deepMerge(target[key], source[key]);
                }
            }
        }
        return destination;
    }

    /**
     * Parse flags
     * @param {Array<String>} args - An array of arguments to parse flags from
     * @returns {Object} An object following the structure { `argName`: `value` }
     */
    parseFlags(args) {
        const parsedFlags = {};
        args.forEach(arg => {
            if (!arg.includes("--")) {
                return;
            }
            parsedFlags[arg.split("--")[1].split("=")[0].toLowerCase()] = arg.includes("=") ? arg.split("=")[1] : true;
        });
        return parsedFlags;
    }

    /**
     *
     *
     * @param {Array<String>} args - An array of arguments to parse parameters from
     * @param {Command} command - The invoked command
     * @returns {Object} An object following the structure { `argName`: `value` }
     */
    parseParams(args, command) {
        if (command.expectedArgs) {
            const expectedArgs = command.expectedArgs.split(/\s+/);
            const parsedArgs = {};
            for (let i = 0; i < args.length; i++) {
                if (expectedArgs[i] && !args[i].startsWith("--")) {
                    if (i === expectedArgs.length - 1 && expectedArgs[i].split(":")[1] === "string") {
                        parsedArgs[expectedArgs[i].split(":")[0]] = args.slice(i).join(" ");
                    } else {
                        parsedArgs[expectedArgs[i].split(":")[0]] = args[i];
                    }
                }
            }
            return parsedArgs;
        }
    }

    /**
     *
     * This is the method that should be used over `parseParams()` and `parseFlags` as it calls both
     * @param {Array<String>} args The args to parse
     * @param {Command} command The command
     * @returns {Object} An object following the structure { `argName`: `value` }
     */
    parseArgs(args, command) {
        const parsedParams = this.parseParams(args, command);
        const parsedFlags = this.parseFlags(args);
        return { ...parsedParams, ...parsedFlags };
    }

    /**
     * Validate the arguments given in a command
     * @param {Array<String>} args The args to validate
     * @param {Command} command The command
     * @param {UserEntry} userEntry The user entry
     * @param {GuildEntry} guildEntry The guild entry
     * @returns {String|Boolean} Returns `true` if the validation passed, or an error message otherwise
     */
    validateArgs(args, command, userEntry, guildEntry) {
        let error;
        const self = this;
        const validate = function (value, expectedValue, param) {
            if ((expectedValue === "int" || expectedValue === "number") && Number.isNaN(Number(value))) {
                const string = expectedValue === "int" ? "generic.param-must-be-int" : "generic.param-must-be-number";
                return error = self.client.i18n(string, { lng: userEntry.props.lang || (guildEntry ? guildEntry.props.lang : false) || "en-US", param });
            } else if (expectedValue.startsWith("(")) {
                let expectedValues = expectedValue.slice(1, expectedValue.length - 1).split("|");
                if (!expectedValues.includes(value.toLowerCase())) {
                    return error = self.client.i18n("generic.param-must-be-either", { lng: userEntry.props.lang || (guildEntry ? guildEntry.props.lang : false) || "en-US", param, list: expectedValues.map(e => `\`${e}\``).join(", ") });
                }
            }
        };
        if (command.expectedArgs) {
            const expectedArgs = command.expectedArgs.split(/\s+/);
            if (args.length < expectedArgs.filter(a => !a.endsWith("*")).length) {
                return error = self.client.i18n("generic.missing-args", { amount: expectedArgs.filter(a => !a.endsWith("*")).length - args.length, help: `<@!${this.client.user.id}> help ${command.name}`, interpolation: { escapeValue: false } });
            }
            // Put flags at the end so they don't interfere with the order of regular params
            for (let i = 0; i < args.length; i++) {
                if (args[i].startsWith("--")) {
                    args.push(args.splice(i, 1)[0]);
                }
            }
            for (let i = 0; i < args.length; i++) {
                if (error) {
                    return error;
                }
                if (args[i].startsWith("--")) {
                    let value = args[i].split("=")[1];
                    let param = args[i].split("=")[0].slice(2);
                    let expectedValue = expectedArgs.find(a => a.split(":")[0] === param);
                    if (!expectedValue) {
                        continue;
                    }
                    validate(value, expectedValue, param);
                } else if (expectedArgs[i]) {
                    validate(args[i], expectedArgs[i].split(":")[1], expectedArgs[i].split(":")[0]);
                }
            }
        }
        return true;
    }

    /**
     * Check if a message calls for a command
     * As it checks the guild's custom prefix, the guild's database entry has to be passed if the message was sent in a guild
     * @param {Message} message - The message object to parse the command from
     * @param {GuildEntry} guildEntry - The guild database entry
     * @returns {Command} - The command object, or `undefined` if the message is not prefixed or the command does not exist
     */
    parseCommand(message, guildEntry) {
        const args = message.content.split(/\s+/);
        // @ts-ignore
        let prefixes = [...this.client.prefixes]; //Clone this.client.prefixes to not modify it
        let prefix = args[0];
        let command = args[1];
        if (guildEntry && guildEntry.props.prefix) {
            if (!guildEntry.props.spacedPrefix) {
                const unspacedParsing = this._parseUnspacedCommand(message, guildEntry, args);
                prefix = unspacedParsing.prefix;
                command = unspacedParsing.command;
            }
            prefixes.push(guildEntry.props.prefix);
            prefixes = prefixes.filter(p => (guildEntry.spacedPrefix && p !== process.env.PREFIX) || !guildEntry.spacedPrefix);
        }
        if (!prefixes.find(p => p === prefix)) {
            return undefined;
        } else if (!command) {
            return undefined;
        }
        return this.client.commands.get(command.toLowerCase()) || this.client.commands.get(this.client.aliases.get(command.toLowerCase()));
    }

    /**
     *
     *
     * @param {Message} message message
     * @param {GuildEntry} guildEntry guildEntry
     * @param {Array<String>} args args
     * @returns {{prefix: String, command: String}} unspaced command
     * @memberof Command
     */
    _parseUnspacedCommand(message, guildEntry, args) {
        const mentionTest = message.content.startsWith(`<@${this.client.bot.user.id}>`) || message.content.startsWith(`<@!${this.client.bot.user.id}`);
        const supposedCommand = !mentionTest
            ? args.shift().slice(guildEntry.prefix.length).toLowerCase()
            : (args[1] ? args[1].toLowerCase() : false);
        const prefix = !mentionTest ? message.content.substr(0, guildEntry.prefix.length) : args[0];
        return {
            prefix,
            command: supposedCommand
        };
    }

    /**
     * Converts a string from camelCase to snek_case
     * @param {String} string The camelCase string to convert to snek_case
     * @returns {String} The given string in snek_case
     */
    camelCaseToSnekCase(string) {
        let chars = string.split("");
        let newString = "";
        for (const char of chars) {
            if (char.toUpperCase() === char) {
                newString += `_${char.toLowerCase()}`;
            } else {
                newString += char;
            }
        }
        return newString;
    }
};