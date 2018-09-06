const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class RemoveSong extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'removesong',
                description: 'Remove the song at the specified position in the queue',
                usage: '{prefix}removesong <position>'
            },
            conf: { aliases: ['rs'] }
        }, { userInVC: true, playing: true });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        const removedTrack = context.connection.removeTrack(context.position);
        return context.message.channel.createMessage(`:white_check_mark: Successfully removed the track \`${removedTrack.info.title}\` by \`${removedTrack.info.author}\``);
    }
}

module.exports = RemoveSong;