/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("../ExtendedStructures/ExtendedUser")} ExtendedUser
*/

const Command = require('../Command');

class ImageCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string}} [options]  - `noArgs` specify a message to return if no arguments are provided.
     *  These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Image',
            conf: {
                require: ['weebSH', 'taihou'],
                requirePerms: ['embedLinks', 'attachFiles'],
            },
            emote: 'picture'
        }});
        this.options = options;
    }

    /**
     * 
     * @param {ImageContext} context - The context
     * @param {Boolean} typing - Whether the bot is typing right now 
     * @param {*} error - The error
     * @returns {void}
     */
    handleError(context, typing, error) {
        if (typing) {
            context.client.bot.sendChannelTyping(context.message.channel.id);
        }
        throw error;
    }

    /**
     * If possible, get the user's avatar URL in `.webp` format
     * @param {ExtendedUser} user - The user
     * @returns {String} The user's avatar URL  
     */
    useWebpFormat(user) {
        return user.avatarURL ? user.avatarURL.replace(/.jpeg|.jpg|.png|.gif/g, '.webp') : user.defaultCDNAvatar;
    }

}

module.exports = ImageCommands;