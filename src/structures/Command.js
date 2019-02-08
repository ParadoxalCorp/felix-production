// @ts-nocheck
/**
 * @typedef {import("../Cluster")} Client
 * @typedef {import("./Context")} Context
 */

/** @typedef {Object} FunctionParams
 * @param {Context} context The context
 */
class Command {
    /**
     *Creates an instance of Command.
     * @param {Client} client The client instance
     * @param {CommandCallback} fn The function defining the behavior of the command
     * @memberof Command
     */
    constructor(client, fn) {
        this.client = client;
        this.run = fn;
        /** @type {String} The name of the command */
        this.name;
        /** @type {String} The description of the command */
        this.description;
        /** @type {String} The internally expected args */
        this.expectedArgs;
        /** @type {Array<String>} An array of aliases */
        this.aliases = [];
        /** @type {String} The command's category */
        this.category;
        /** @type {Boolean} Whether this command is restricted to the guild's owner only, `false` by default */
        this.guildOwnerOnly = false;
        /** @type {Boolean} Whether this command is hidden; As in, usable but not displayed on help, `false` by default */
        this.hidden = false;
        /** @type {Boolean} Whether this command is restricted to the bot owner only, `false` by default */
        this.ownerOnly = false;
        /** @type {Number} The cooldown in milliseconds this command should apply on the user, `2000` by default */
        this.cooldown = 2000;
    }
    
    /**
     * Sets the name of the command
     * @param {String} name The name of the command
     * @returns {Command} Returns the command
     */
    setName(name) {
        if (typeof name !== "string") {
            throw new Error(`Expected type "string", received type "${typeof name}"`);
        }
        this.name = name;
        return this;
    }

    /**
     * Sets the description of the command
     * @param {String} description The description of the command
     * @returns {Command} Returns the command
     */
    setDescription(description) {
        if (typeof description !== "string") {
            throw new Error(`Expected type "string", received type "${typeof description}"`);
        }
        this.description = description;
        return this;
    }

    /**
     * This defines the internally expected args
     * @param {String} expectedArgs The internally expected args, this should look like `arg1:string arg2:userResolvable arg3:number*` where `*` at the end indicates an optional argument
     * @returns {Command} Returns the command
     */
    setExpectedArgs(expectedArgs) {
        if (typeof expectedArgs !== "string") {
            throw new Error(`Expected type "string", received type "${typeof expectedArgs}"`);
        }
        this.expectedArgs = expectedArgs;
        return this;
    }

    /**
     * Set whether this command should be restricted to the guild owner only
     * @param {Boolean} bool Whether this command should be restricted to the guild owner only, `false` by default 
     * @returns {Command} Returns the command
     */
    setGuildOwnerOnly(bool) {
        if (typeof bool !== "boolean") {
            throw new Error(`Expected type "boolean", received type "${typeof bool}"`);
        }
        this.guildOwnerOnly = bool;
        return this;
    }

    /**
     * Set whether this command should be usable but hidden in the help
     * @param {Boolean} bool Whether this command should be usable but hidden in the help, `false` by default 
     * @returns {Command} Returns the command
     */
    setHidden(bool) {
        if (typeof bool !== "boolean") {
            throw new Error(`Expected type "boolean", received type "${typeof bool}"`);
        }
        this.hidden = bool;
        return this;
    }

    /**
     * Set whether this command should be restricted to the bot owner only
     * @param {Boolean} bool Whether this command should be restricted to the bot owner only, `false` by default 
     * @returns {Command} Returns the command
     */
    setOwnerOnly(bool) {
        if (typeof bool !== "boolean") {
            throw new Error(`Expected type "boolean", received type "${typeof bool}"`);
        }
        this.ownerOnly = bool;
        return this;
    }

    /**
     * Set the cooldown in milliseconds that should be applied on the user when using this command
     * @param {Boolean} ms The cooldown in milliseconds that should be applied on the user, `2000` by default 
     * @returns {Command} Returns the command
     */
    setCooldown(ms) {
        if (typeof ms !== "number") {
            throw new Error(`Expected type "number", received type "${typeof ms}"`);
        }
        this.cooldown = ms;
        return this;
    }
}

/**
 * @callback CommandCallback
 * @param {Context} params
 */

module.exports = Command;