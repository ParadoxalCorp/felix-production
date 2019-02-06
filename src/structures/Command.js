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
    }
    
    /**
     * Sets the name of the command
     * @param {String} name The name of the command
     * @returns {Command} Returns the command
     */
    setName(name) {
        if (typeof name !== "string") {
            throw new Error(`Expected type "string", received type ${typeof name}`);
        }
        this.name = name;
        return this;
    }

    /**
     * Sets the description of the command
     * @param {String} name The description of the command
     * @returns {Command} Returns the command
     */
    setDescription(description) {
        if (typeof description !== "string") {
            throw new Error(`Expected type "string", received type ${typeof description}`);
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
            throw new Error(`Expected type "string", received type ${typeof expectedArgs}`);
        }
        this.expectedArgs = expectedArgs;
        return this;
    }
};

/**
 * @callback CommandCallback
 * @param {Context} params
 */

module.exports = Command;