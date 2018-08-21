const axios = require('axios');
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
        let args = context.message.content.split(/\s+/);
        args.shift();
        if (!args[0]) {
            return context.message.channel.createMessage(":x: You must specify something to search");
        }
        let result = await axios.default.get(
            `https://developer.mozilla.org/en-US/search.json?locale=en-US&q=${encodeURIComponent(args.join())}`, { headers: { 'Content-Type': 'application/json' } })
            .then(r => r.data);
        if (!result.documents || !result.documents.length) {
            return context.message.channel.createMessage(":x: Your search did not returned any result");
        }
        let firstResult = result.documents[0];
        return context.message.channel.createMessage({
            embed: {
                color: context.client.config.options.embedColor.generic,
                title: "MDN",
                url: "https://developer.mozilla.org/en/",
                thumbnail: {
                    url: "https://developer.cdn.mozilla.net/static/img/opengraph-logo.dc4e08e2f6af.png"
                },
                fields: [{
                    name: "Search results",
                    value: `Here's the results for [${context.args.join(" ")}]` + `(
                                        https://developer.mozilla.org/en-US/search?locale=en-US&q=${encodeURIComponent(context.args.join())})`
                }, {
                    name: "**" + firstResult.title + "**",
                    value: firstResult.excerpt
                }],
                timestamp: new Date(),
                footer: {
                    icon_url: context.client.bot.user.avatarURL,
                    text: "MDN search"
                }
            }
        });
    }
}

module.exports = MDN;