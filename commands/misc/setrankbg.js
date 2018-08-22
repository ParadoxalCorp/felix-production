const MiscCommands = require('../../structures/CommandCategories/MiscCommands');
const axios = require('axios').default;
const sharp = require('sharp');

class SetRankBackground extends MiscCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'setrankbg',
                description: 'Set a custom background for your profile on the `rank` command, you can either specify a direct link to the image you want to use or upload it along.\n\nAdditionally, you can do `{prefix}setrankbg reset` to remove your custom background',
                usage: `{prefix}setrankbg <link?|reset?>`
            },
            conf: {
                aliases: ['setrankbackground', 'srb'],
                requireDB: true
            }
        });
    }
    /** @param {import("../../structures/Contexts/MiscContext")} context */

    async run(context) {
        if (context.args[0] === "reset") {
            const notSet = await context.client.handlers.DatabaseWrapper.rethink.table("user_profiles").get(context.message.author.id).run().then(bg => bg ? false : true);
            if (notSet) {
                return context.message.channel.createMessage(':x: You don\'t have any custom background set, so i can\'t reset it');
            } else {
                await context.client.handlers.DatabaseWrapper.rethink.table("user_profiles").get(context.message.author.id).delete().run();
                return context.message.channel.createMessage(':white_check_mark: Successfully reset your custom background');   
            }
        }
        const isLink = context.args[0] && new RegExp(/http:\/\/|https:\/\//g).test(context.args[0]) ? true : false;
        if (!isLink && !context.message.attachments[0]) {
            return context.message.channel.createMessage(`:x: You need to either specify a link to an image or upload one :v`);
        }
        let image;
        if (isLink) {
            image = await context.client.utils.helpers.fetchFromUntrustedSource(context.args[0].replace(/<|>/g, ''), true).then(res => res.data).catch(this.handleErr.bind(this));
        } else {
            image = await axios.get(context.message.attachments[0].url, { responseType: 'arraybuffer' }).then(res => res.data).catch(this.handleErr.bind(this));
        }
        if (!image) {
            return context.message.channel.createMessage(`:x: Oops, seems like i couldn't download the image, make sure the link is valid and if it is try uploading the image instead`);
        }
        image = await this.resizeImage(image);
        if (!image) {
            return context.message.channel.createMessage(':x: Oi, this doesn\'t looks like a valid image to me, make sure it is either `.jpeg/.jpg`, `.png` or `.webp`');
        }
        if (image.length > context.userEntry.tierLimits.profileBgSize) {
            return context.message.channel.createMessage(`:x: I am very sorry but you can't use an image bigger than \`${context.userEntry.tierLimits.profileBgSize / 1000 / 1000}MB\` :v, you can increase this limit by becoming a donator`);
        }
        await context.client.handlers.DatabaseWrapper.set(context.client.structures.References.userRankBackground(context.message.author.id, image), 'user_profiles');
        return context.message.channel.createMessage(`:white_check_mark: Successfully changed your custom rank background image`);
    }

    handleErr(err) {
        this.client.bot.emit("error", err);
        return false;
    }

    resizeImage(buffer) {
        return new Promise((resolve) => {
            return sharp(buffer)
                .resize(300, 300)
                .toFormat('png')
                .toBuffer((err, buf) => {
                    if (err) {
                        return resolve(false);
                    }
                    return resolve(buf.toString('base64'));
                });
        });
    }
}

module.exports = SetRankBackground;