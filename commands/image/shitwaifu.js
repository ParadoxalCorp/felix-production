const GenericCommands = require('../../structures/CommandCategories/ImageCommands');

class ShitWaifu extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'shitwaifu',
                description: 'Uh well, I think the name is pretty self-explanatory',
                usage: '{prefix}shitwaifu <user_resolvable>',
                subCategory: 'image-generation'
            },
            conf: {
                requirePerms: ['attachFiles'],
                guildOnly: true,
                require: ['weebSH', 'taihou']
            },
        });
    }    
    /** @param {import("../../structures/Contexts/ImageContext")} context */

    async run(context) {
        const user = context.args[0] ? await context.getUserFromText(context.args[0]) : context.message.author;
        let typing = false;
        //If the queue contains 2 items or more, expect that this request will take some seconds and send typing to let the user know
        if (context.client.weebSH.korra.requestHandler.queue.length >= 2) {
            context.client.bot.sendChannelTyping(context.message.channel.id);
            typing = true;
        }
        const generatedInsult = await context.client.weebSH.korra.generateWaifuInsult(this.useWebpFormat(user)).catch(this.handleError.bind(this, context, typing));
        return context.message.channel.createMessage(typing ? `<@!${context.message.author.id}> ` : '', {file: generatedInsult, name: `${Date.now()}-${context.message.author.id}.png`});
    }
}

module.exports = ShitWaifu;