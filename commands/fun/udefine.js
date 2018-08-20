const axios = require('axios');
const FunCommands = require('../../structures/CommandCategories/FunCommands');

class Udefine extends FunCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'udefine',
                description: 'Search definitions through urbandictionary',
                usage: 'udefine pizza',
            },
            conf : {
                aliases: ["urdef", "define", "urban"],
            },
        });
    }

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        if (!args[0]) {
            return message.channel.createMessage(":x: No search term specified");
        }
        if (!message.channel.nsfw) {
            return message.channel.createMessage(":x: This command can only be used in a channel set as NSFW");
        }
        const result = await axios.default.get(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(args.join(' '))}`);
        if (!result.data) {
            return message.channel.createMessage(":x: an error occurred");
        }
        if (!result.data.list[0]) {
            return message.channel.createMessage(":x: I couldn't find any results :c");
        }
        const firstResult = result.data.list[0];
        return message.channel.createMessage({
            embed: {
                color: client.config.options.embedColor.generic,
                title: `Results`,
                url: firstResult.permalink,
                fields: [{
                    name: "**Definition:**",
                    value: firstResult.definition.length > 1000 ? firstResult.definition.substr(0, 990) + '...' : firstResult.definition
                }, {
                    name: "**Example:**",
                    value: '*' + firstResult.example + '*'
                }, {
                    name: "**Author:**",
                    value: firstResult.author
                }],
                footer: {
                    text: `👍${firstResult.thumbs_up} | ${firstResult.thumbs_down}👎`
                },
                timestamp: new Date()
            }
        });
    }
}

module.exports = new Udefine();