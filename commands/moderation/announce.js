const ModerationCommands = require('../../structures/CommandCategories/ModerationCommands');

class Announce extends ModerationCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'announce',
                description: 'Announce something with a beautiful (or smth) embed',
                usage: '{prefix}announce',
            },
            conf: {
                expectedArgs: [
                    {
                        description: "What's the title of this announcement (max: 256 characters)?"
                    },
                    {
                        description: "What's the color of this announcement? You can choose between the 3 predefined ones: `red`, `orange`, `lightblue` or use a custom HEX color in the format `#000000`"
                    },
                    {
                        description: "What's the content of this announcement? You can use the usual markdown, and even masked links using `[masked link](https://google.com)`"
                    },
                    {
                        description: "Finally, in which channel should I send the announcement?"
                    }
                ]
            },
        });
    }
    /** @param {import("../../structures/Contexts/ModerationContext")} context */

    async run(context) {
        let embedObject = {
            title: '',
            description: '',
            footer: {
                icon_url: context.message.author.avatarURL,
                text: `${context.message.author.username}#${context.message.author.discriminator}`
            },
            color: 0x000,
            timestamp: new Date()
        };
            
        embedObject.title = context.args[0].substr(0, 256);
        if (!context.args[1]) {
            return context.message.channel.createMessage(':x: You did not specify the color this announcement should take');
        }
        if (context.args[1].trim() === "red") {
            embedObject.color = 0xff0000;
        }
        else if (context.args[1].trim() === "orange") {
            embedObject.color = 0xff6600;
        }
        else if (context.args[1].trim() === "lightblue") {
            embedObject.color = 0x33ccff;
        }
        else if (context.args[1].trim() !== "none") {
            embedObject.color = parseInt(`0x${context.args[1].split("#")[1]}`);
            embedObject.color = embedObject.color === NaN ? 0x000 : embedObject.color;
        }
        else { 
            embedObject.color = parseInt(`0x${context.args[1].trim().substr(0,7)}`);
        }
        embedObject.description = context.args[2];
        if (!embedObject.description) {
            return context.message.channel.createMessage(':x: You did not specify the description this announcement should have');
        }
        if (!context.args[3]) {
            return context.message.channel.createMessage(':x: You did not specify where I should send this announcement');
        }
        const channel = await this.getChannelFromText({client: context.client, message: context.message, text: context.args[3]});
        if (!channel) {
            return context.message.channel.createMessage(':x: I couldn\'t find the channel you specified :v');
        }
        return channel.createMessage({
            embed: embedObject
        });
    }
}

module.exports = Announce;