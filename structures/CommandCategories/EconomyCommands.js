/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("../Contexts/EconomyContext")} EconomyContext
* @typedef {import("../HandlersStructures/commonEvents").CommonEvent} CommonEvent
* @typedef {import("../HandlersStructures/commonEvents").ConditionalVariantContext} ConditionalVariantContext
*/

const Command = require('../Command');

class EconomyCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string}} [options]  - `noArgs` specify a message to return if no arguments are provided.
     *  These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Economy',
            emote: 'moneybag',
            conf: {
                requireDB: true
            }
        }});
        this.options = options;
    }

    /**
     *
     *
     * @param {EconomyContext} context - The context
     * @param {CommonEvent} event - The event
     * @returns {ConditionalVariantContext} A random conditional variant
     * @memberof EconomyCommands
     */
    selectRandomVariant(context, event) {
        const conditionalVariants = event.conditionalVariants.filter(v => v.condition(context.userEntry));
        const randomVariant = conditionalVariants[context.client.utils.getRandomNumber(0, conditionalVariants.length - 1)];
        return randomVariant && randomVariant.context ? randomVariant.context(context.userEntry) : randomVariant;
    }
}

module.exports = EconomyCommands;