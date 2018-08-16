'use strict';

const Command = require('../../structures/Command');
const axios = require('axios').default;
const querystring = require('querystring');
const sharp = require('sharp');

class WhatAnime extends Command {
    constructor() {
        super();
        this.help = {
            name: 'whatanime',
            category: 'utility',
            description: 'Search through whatanime.ga to find from what anime is the given picture\n\nTo use this command, you have to upload the image along with the command. If no image is uploaded, Felix will try to search for an image in the latest 10 messages and use it if there is any',
            usage: '{prefix}whatanime'
        };
        this.conf = {
            requireDB: false,
            disabled: false,
            aliases: ['what'],
            requirePerms: [],
            guildOnly: false,
            ownerOnly: false,
            expectedArgs: []
        };
        this.extra = {
            imageExtensions: ['gif', 'png', 'jpg', 'jpeg', 'webp']
        };
    }

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        let image = message.attachments[0];
        if (!image) {
            image = Array.from(message.channel.messages.values())
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 10)
                .find(m => m.attachments[0] ? this.validateFile(m.attachments[0]) : false);      
        }
        if (!image) {
            return message.channel.createMessage(`You didn't uploaded any image that can be used, if you uploaded an image, note that the image must: \n-Have one of the following extensions: ${this.extra.imageExtensions.map(e => '`.' + e + '`').join(', ')}\n-Be under 1MB`);
        }
        image = await this.downloadImage((image.attachments ? image.attachments[0] : false) || image);
        image = await this.processImage(image);
        if (image.length > 1000000) {
            return message.channel.createMessage(`I tried to make it as small as could, but seems like your image is too big. whatanime.ga doesn't accept anything bigger than 1MB`);
        }
        const formData = querystring.stringify({image});
        const request = await axios.post(`http://${client.config.requestHandler.host}:${client.config.requestHandler.port}/request`, {
            data: formData,
            service: 'whatanime.ga',
            route: '/search',
            headers: {
                'Content-Length': formData.length
            },
            method: 'post',
            channelID: message.channel.id,
            userID: message.author.id,
            dm: message.channel.guild ? false : true,
            nsfw: message.channel.nsfw,
            botToken: client.config.token
        }, {
            responseType: 'application/json'
        }).catch(err => client.bot.emit('error', err, message, false));
        if (!request.data || !request.data.queued) {
            return message.channel.createMessage(`:x: Oh uh, your request couldn't be queued, maybe try again later?`);
        }
        return message.channel.createMessage(`Your request has been queued ! I'll get back to you once its done (estimated time: ${Math.round((4000 + request.data.estimatedTime) / 1000)} seconds)`);
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

module.exports = new WhatAnime();