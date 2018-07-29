'use strict';

const Command = require('../../util/helpers/modules/Command');
const axios = require('axios').default;
const querystring = require('querystring');

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
                .find(m => this.validateFile(m.attachments[0]));      
        }
        if (!image) {
            return `You didn't uploaded any image that can be used, if you uploaded an image, note that the image must: \n-Have one of the following extensions: ${this.extra.imageExtensions.map(e => '`.' + e + '`').join(', ')}\n-Be under 1MB`;
        }
        image = await this.downloadImage(image);
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
            nsfw: message.channel.nsfw
        }, {
            responseType: 'application/json'
        }).catch(err => client.bot.emit('error', err, message));
        if (!request.data.queued) {
            return message.channel.createMessage(`:x: Oh uh, your request couldn't be queued, maybe try again later?`);
        }
        return message.channel.createMessage(`Your request has been queued ! I'll get back to you once its done (estimated time: ${Math.round((4000 + request.data.estimatedTime) / 1000)} seconds)`);
    }

    validateFile(attachment) {
        const fileExtension = attachment.filename.split('.')[attachment.filename.split('.').length - 1];
        return (attachment.size > 1048576 || !this.extra.imageExtensions.includes(fileExtension)) ? false : true;
    }

    async downloadImage(attachment) {
        let image = await axios.get(attachment.url, {
            responseType: 'arraybuffer'
        });
        image = image.data.toString('base64');
        return image;
    }
}

module.exports = new WhatAnime();