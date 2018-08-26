const axios = require('axios').default;
const UtilityCommands = require('../../structures/CommandCategories/UtilityCommands');

class MDN extends UtilityCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'mdn',
                description: 'Search something through the Mozilla Developer Network',
                usage: '{prefix}mdn arrays',
            },
        });
    }

    /** @param {import("../../structures/Contexts/UtilityContext")} context */

    async run(context) {
        if (!context.args[0]) {
            return context.message.channel.createMessage(":x: You must specify something to search");
        }
        if (context.args.join(" ").length > 100) {
            return context.message.channel.createMessage(":x: You can't search for something over 100 characters");
        }
        const result = await axios.get(
            `https://developer.mozilla.org/en-US/search.json?locale=en-US&q=${encodeURIComponent(context.args.join(" "))}`, { headers: { 'Content-Type': 'application/json' } })
            .then(r => r.data);
        if (!result.documents || !result.documents[0]) {
            return context.message.channel.createMessage(":x: Your search did not returned any result");
        }
        result.documents = result.documents.map(document => {
            return {
                embed: {
                    color: context.client.config.options.embedColor.generic,
                    title: context.args.join().substr(0, 124),
                    url: `https://developer.mozilla.org/en-US/search?locale=en-US&q=${encodeURIComponent(context.args.join(" "))}`,
                    thumbnail: {
                        url: "https://developer.cdn.mozilla.net/static/img/opengraph-logo.dc4e08e2f6af.png"
                    },
                    fields: [{
                        name: document.title,
                        value: `${document.excerpt.replace(/\<mark\>/gm, '`').replace(/\<\/mark\>/gm, '`').substr(0, 1000)}..`
                    }, {
                        name: 'Tags',
                        value: document.tags.join(', ')
                    }],
                    timestamp: new Date(),
                    footer: {
                        icon_url: context.client.bot.user.avatarURL,
                        text: "Showing page {index}/{length}"
                    }
                }
            };
        });
        return context.client.handlers.InteractiveList.createPaginatedMessage({
            channel: context.message.channel,
            messages: result.documents,
            userID: context.message.author.id
        });
    }
}

module.exports = MDN;