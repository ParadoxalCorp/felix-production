/** @typedef {import("../main.js")} Client 
 * @typedef {import("eris").MessageContent} MessageContent
 * @typedef {import("eris").TextChannel} TextChannel
 * @typedef {import("eris").Message} Message
*/

/** @typedef {Object} CustomReaction
 * @prop {String} unicode The unicode this reaction take
 * @prop {Function<Message, MessageContent, String>} callback A callback that will be called with the `message, messageContent, reaction` parameters, each respectively representing the created interactive message, the current page's content and the reaction
 */


class InteractiveList {
    /**
     * Provides methods to create an "interactive list" message, basically a message with "pages"
     * @param {Client} client - The client instance
     */
    constructor(client) {
        this.client = client;
        this.ongoingList = new client.Collection();
    }

    /**
     * Create a paginated message
     * @param {object} params - An object of parameters
     * @param {TextChannel} params.channel - The channel where to create the message
     * @param {Array<MessageContent>} params.messages - An array of messages (string or objects), each will represent a page (every {index} instance in strings will be replaced by the current page)
     * @param {String} params.userID - The ID of the user to wait reactions from
     * @param {Function} [params.filter] - An optional filter function that will be passed to the reaction collector
     * @param {Number} [params.timeout=60000] - Time of inactivity in milliseconds before this should be aborted, default is 60000
     * @param {Array<CustomReaction>} [params.reactions] - Additional array of {unicode: reaction, callback: callback()} objects
     * @returns {Promise<void>} - Returns a promise with no particular value
     */
    async createPaginatedMessage(params) {
        const paginatedMessages = this._replacePageTags(params.messages);
        const reactions = params.reactions ? ['◀', '▶', ...params.reactions.map(r => r.unicode), '❌'] : ['◀', '▶', '❌'];
        const message = await params.channel.createMessage(paginatedMessages[0]);
        for (const reaction of reactions) {
            await message.addReaction(reaction);
        }
        let page = 0;

        this.ongoingList.set(`${message.timestamp}/${params.userID}`, true);
        message.exit = () => {
            message.delete().catch(() => {});
            this.ongoingList.delete(`${message.timestamp}/${params.userID}`);
        };
        this.client.handlers.ReactionCollector.awaitReaction(params.channel.id, message.id, params.userID, params.timeout, params.filter)
            .then(r => {
                return this._handleReaction(params, r, page, message, paginatedMessages);
            });
    }

    /**
     * 
     * @param {Array<MessageContent>} messages - An array of messages to replace the page tags from
     * @returns {Array<MessageContent>} - The messages with their page tags replaced
     */
    _replacePageTags(messages) {
        let page = 1;
        const tags = [[new RegExp(/{index}/gim), page], [new RegExp(/{length}/gim), messages.length], [new RegExp(/undefined/gim), '']];
        const replaceTags = (text) => {
            for (const tag of tags) {
                text = text.replace(tag[0], tag[1]);
            }
            return text;
        };
        messages = messages.map(message => {
            if (typeof message === "object") {
                message = this.client.utils.traverse(message, (value) => {
                    if (Array.isArray(value)) {
                        value = value.map(field => {
                            if (typeof field.value === "number") {
                                field.value = `${field.value}`;
                            }
                            field.name = replaceTags(field.name);
                            field.value = replaceTags(field.value);
                            return field;
                        });
                    } else {
                        if (typeof value === 'string') {
                            // @ts-ignore
                            value = replaceTags(value);
                        }
                    }
                    return value;
                }, ["item"]);
            } else {
                message = replaceTags(message);
            }
            page++;
            return message;
        });

        return messages;
    }

    /**
     * 
     * @param {object} params - The object of parameters
     * @param {object} reaction - The reaction object given by the reaction collector
     * @param {number} page - The current page
     * @param {object} message - The message
     * @param {array} paginatedMessages - The messages with replaced page tags
     * @private
     * @returns {Promise<void>} Returns a promise with no particular value
     */
    async _handleReaction(params, reaction, page, message, paginatedMessages) {
        reaction ? message.removeReaction(reaction.emoji.name, params.userID).catch(() => {}) : 'baguette';
        if (!reaction) {
            message.delete().catch(() => {});
            return;
        } else if (reaction.emoji.name === '◀') {
            page = page === 0 ? paginatedMessages.length - 1 : page - 1;
            await message.edit(paginatedMessages[page]);
            return this.client.handlers.ReactionCollector.awaitReaction(params.channel.id, message.id, params.userID, params.timeout, params.filter)
                .then(r => this._handleReaction(params, r, page, message, paginatedMessages));
        } else if (reaction.emoji.name === '▶') {
            page = page === paginatedMessages.length - 1 ? 0 : page + 1;
            await message.edit(paginatedMessages[page]);
            return this.client.handlers.ReactionCollector.awaitReaction(params.channel.id, message.id, params.userID, params.timeout, params.filter)
                .then(r => this._handleReaction(params, r, page, message, paginatedMessages));
        } else if (reaction.emoji.name === '❌') {
            message.exit();
            return;
        } else if (params.reactions && params.reactions.map(r => r.unicode).includes(reaction.emoji.name)) {
            await params.reactions.find(r => r.unicode === reaction.emoji.name).callback(message, params.messages[page], reaction);
            if (!this.ongoingList.get(`${message.timestamp}/${params.userID}`)) {
                return;
            }
            return this.client.handlers.ReactionCollector.awaitReaction(params.channel.id, message.id, params.userID, params.timeout, params.filter)
                .then(r => this._handleReaction(params, r, page, message, paginatedMessages));
        }
    }
}

module.exports = InteractiveList;