/** @typedef {import("../main.js")} Client */

/**
 * Generate the image sub-commands and such
 * @class ImageHandler
 */
class ImageHandler {
    /**
     * 
     * @param {Client} client - The client instance
     */
    constructor(client) {
        this.client = client;
        this.interactions = {
            hug: {
                usage: '{prefix}hug <user_resolvable>',
                interaction: 'you\'ve just been hugged by'
            },
            pat: {
                usage: '{prefix}pat <user_resolvable>',
                interaction: 'you\'ve just been patted by'
            },
            cuddle: {
                usage: '{prefix}cuddle <user_resolvable>',
                interaction: 'you\'ve just been cuddled by'
            },
            kiss: {
                usage: '{prefix}kiss <user_resolvable>',
                interaction: 'you\'ve just been kissed by'
            },
            lick: {
                usage: '{prefix}lick <user_resolvable>',
                interaction: 'you\'ve just been l-licked by'
            },
            slap: {
                usage: '{prefix}slap <user_resolvable>',
                interaction: 'you\'ve just been slapped by'
            },
            tickle: {
                usage: '{prefix}tickle <user_resolvable>',
                interaction: 'you\'ve just been tickled by'
            },
            poke: {
                usage: '{prefix}poke <user_resolvable>',
                interaction: 'you\'ve just been poked by'
            },
        };
    }

    async generateSubCommands() {
        const imageTypes = await this.context.client.weebSH.toph.getImageTypes({preview: true});
        const ImageCommands = require('../structures/CommandCategories/ImageCommands');
        let generated = 0;
        const imageHandler = this;
        for (const type of imageTypes.types) {
            const preview = imageTypes.preview.find(p => p.type === type);
            class SubCommand extends ImageCommands {
                constructor(client) {
                    super(client, {
                        help : {
                            name: type,
                            subCategory: imageHandler.interactions[type] ? 'interactions' : 'images',
                            preview: preview.url,
                            description: `Return a ${type} image`,
                            usage: imageHandler.interactions[type] ? imageHandler.interactions[type].usage : `${type}`
                        },
                        conf : {
                            guildOnly: imageHandler.interactions[type] ? true : false,
                            require: ['weebSH', 'taihou'],
                            requirePerms: ['embedLinks'],
                            subCommand: true
                        },
                    });
                }
                /** @param {import("../structures/Contexts/ImageContext")} context */

                async run(context) {
                    const image = await context.client.weebSH.toph.getRandomImage(type);
                    if (!imageHandler.interactions[type]) {
                        return context.message.channel.createMessage({
                            embed: {
                                image: {
                                    url: image.url,
                                },
                                footer: {
                                    text: 'Powered by weeb.sh and the Taihou wrapper'
                                },
                                color: context.client.config.options.embedColor.generic
                            }});
                    }
                    const users = await (async() => {
                        let resolvedUsers = [];
                        for (const arg of context.args) {
                            const resolved = await this.getUserFromText({client: context.client, message: context.message, text: arg});
                            // @ts-ignore
                            if (resolved && !resolvedUsers.find(u =>  u.id === resolved.id) && (resolved.id !== context.message.author.id)) {
                                resolvedUsers.push(resolved);
                            }
                        }
                        // @ts-ignore
                        return resolvedUsers.filter(u => u.id !== context.message.author.id);
                    })();
                    return context.message.channel.createMessage({
                        embed: {
                            // @ts-ignore
                            description: users[0] ? `Hey ${users.map(u => u.mention).join(', ')}, ${imageHandler.interactions[type].interaction} ${context.message.author.mention} !` : `Trying to ${type} yourself eh? That's cute`,
                            image: {
                                url: image.url
                            },
                            footer: {
                                text: 'Powered by weeb.sh and the Taihou wrapper'
                            },
                            color: context.client.config.options.embedColor.generic
                        }
                    });
                }
            }
            imageHandler.context.client.commands.set(type, new SubCommand());
            generated++;
        }
        return generated;
    }
}

module.exports = ImageHandler;