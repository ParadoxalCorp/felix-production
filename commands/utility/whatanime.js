const axios = require('axios').default;
const querystring = require('querystring');
const sharp = require('sharp');
const UtilityCommands = require('../../structures/CommandCategories/UtilityCommands');

class WhatAnime extends UtilityCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'whatanime',
                description: `Search through trace.moe to find from what anime is the given picture\n\nTo use this command, you have to upload the image along with the command or specify a direct link to the image. If no image is uploaded nor any link is specified, ${client.config.codename} will try to search for an image in the latest 10 messages and use it if there is any`,
                usage: '{prefix}whatanime <url?>',
            },
            conf: {
                aliases: ['what'],
            },
        });
        this.extra = {
            imageExtensions: ['gif', 'png', 'jpg', 'jpeg', 'webp']
        };
    }
    /** @param {import("../../structures/Contexts/UtilityContext")} context */

    async run(context) {
        let image = context.message.attachments[0] || (context.args[0] && (context.args[0].toLowerCase().includes('http://') || context.args[0].toLowerCase().includes('https://'))) ? context.message : false;
        if (!image) {
            const lastChannelMessages = await context.message.channel.getMessages(10);
            image = lastChannelMessages
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .find(m => m.attachments[0] ? this.validateFile(m.attachments[0]) : false);      
        }
        if (!image) {
            return context.message.channel.createMessage(`You didn't uploaded any image that can be used, if you uploaded an image, note that the image must: \n-Have one of the following extensions: ${this.extra.imageExtensions.map(e => '`.' + e + '`').join(', ')}\n-Be under 1MB`);
        }
        if (image.content && !image.attachments[0]) {
            image = await context.client.utils.helpers.fetchFromUntrustedSource(context.args[0].replace(/\<|\>/g, ''), true).catch(() => false).then(res => res.data);
            if (!image) {
                return context.message.channel.createMessage(`aw :v, i couldn't download your image, double-check if your link is valid and if it is, try again later`);
            }
        } else {
            image = await this.downloadImage((image.attachments ? image.attachments[0] : false) || image);
        }

        image = await this.processImage(image).catch(() => false);
        if (!image) {
            return context.message.channel.createMessage(`It seems like the link you provided isn't a direct link to a valid image :v`);
        }
        if (image.length > 1000000) {
            return context.message.channel.createMessage(`I tried to make it as small as i could, but seems like your image is too big. trace.moe doesn't accept anything bigger than 1MB`);
        }

        const formData = querystring.stringify({image});
        const request = await axios.post(`http://${context.client.config.requestHandler.host}:${context.client.config.requestHandler.port}/request`, {
            data: formData,
            service: 'trace.moe',
            route: '/search',
            headers: {
                'Content-Length': formData.length
            },
            method: 'post',
            channelID: context.message.channel.id,
            userID: context.message.author.id,
            dm: context.message.channel.guild ? false : true,
            nsfw: context.message.channel.nsfw,
            botToken: context.client.config.token
        }, {
            responseType: 'application/json'
        }).catch(err => context.client.bot.emit('error', err, context.message, false));
        if (!request.data || !request.data.queued) {
            return context.message.channel.createMessage(`:x: Oh uh, your request couldn't be queued, maybe try again later?`);
        }
        return context.message.channel.createMessage(`Your request has been queued ! I'll get back to you once its done (estimated time: ${Math.round((4000 + request.data.estimatedTime) / 1000)} seconds)`);
    }

    validateFile(attachment) {
        const fileExtension = attachment.filename.split('.')[attachment.filename.split('.').length - 1];
        return this.extra.imageExtensions.includes(fileExtension);
    }

    async downloadImage(attachment) {
        let image = await axios.get(attachment.url, {
            responseType: 'arraybuffer'
        });
        return image.data;
    }

    processImage(buffer) {
        return new Promise((resolve, reject) => {
            return sharp(buffer)
                .resize(320, 180)
                .toFormat('jpeg')
                .toBuffer((err, buf) => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve(buf.toString('base64'));
                });
        });
    }
}

module.exports = WhatAnime;