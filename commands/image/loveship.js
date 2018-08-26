const GenericCommands = require('../../structures/CommandCategories/ImageCommands');

class LoveShip extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'loveship',
                description: 'Ship a user with another user !',
                usage: '{prefix}loveship <user_resolvable> <user_resolvable>',
                subCategory: 'image-generation'
            },
            conf: {
                aliases: ['ship'],
                requirePerms: ['attachFiles'],
                guildOnly: true,
                require: ['weebSH', 'taihou']
            },
        }, { noArgs: ':x: You need to specify at least one user to ship' });
    }
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run(context) {
        const firstUser = await this.getUserFromText({client: context.client, message: context.message, text: context.args[0]});
        const secondUser = context.args[1] ? await this.getUserFromText({client: context.client, message: context.message, text: context.args.splice(1).join(' ')}) : context.message.author;
        if (!firstUser && secondUser.id === context.message.author.id) {
            return context.message.channel.createMessage(':x: I\'m sorry but I couldn\'t find the users you specified :c');
        } else if (firstUser.id === secondUser.id) {
            return context.message.channel.createMessage(`:x: You can't match a user with themselves, like, why?`);
        }
        let typing = false;
        //If the queue contains 2 items or more, expect that this request will take some seconds and send typing to let the user know
        if (context.client.weebSH.korra.requestHandler.queue.length >= 2) {
            context.client.bot.sendChannelTyping(context.message.channel.id);
            typing = true;
        }
        const generatedShip = await context.client.weebSH.korra.generateLoveShip(this.useWebpFormat(firstUser), this.useWebpFormat(secondUser)).catch(this.handleError.bind(this, context, typing));
        const match = (() => {
            let msg = typing ? `<@!${context.message.author.id}> ` : '';
            msg += `I, Felix von Trap, by the powers bestowed upon me, declare this a **${this.calculateMatch(firstUser.id, secondUser.id)}** match`;
            return msg;
        })();
        return context.message.channel.createMessage(match, {file: generatedShip, name: `${Date.now()}-${context.message.author.id}.png`});
    }

    calculateMatch(firstID, secondID) {
        const total = parseInt(firstID) + parseInt(secondID);
        const sliced = total.toString().split('');
        return `${sliced[6]}${sliced[15]}%`;
    }
}

module.exports = LoveShip;