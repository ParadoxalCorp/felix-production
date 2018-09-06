const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class ForceSkipTo extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'forceskipto',
                description: 'Force-skip to the specified position in the queue',
                usage: '{prefix}forceskipto <position>'
            },
            conf: { 
                aliases: ['fskipto'],
                expectedArgs: [{
                    description: 'Please specify the position in the queue of the song you want to skip to'
                }]
            }
        }, { userInVC: true, playing: true });
    }
    /** @param {import("../../structures/Contexts/MusicContext.js")} context */

    async run(context) {
        const skippedTo = context.connection.queue[context.position];
        context.connection.skipTrack(context.position);
        return context.message.channel.createMessage(`:white_check_mark: Succesfully skipped to the song \`${skippedTo.info.title}\` by \`${skippedTo.info.author}\``);
    }
}

module.exports = ForceSkipTo;