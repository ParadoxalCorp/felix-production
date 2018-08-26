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
        let position = context.args[0];
        if (!this.isValidPosition(position, context.connection.queue)) {
            return context.message.channel.createMessage(':x: You did not specify a valid number ! You must specify a number corresponding to the position in the queue of the song you want to skip to');
        }
        position = parseInt(position) - 1;
        const removedTrack = context.connection.removeTrack(position);
        return context.message.channel.createMessage(`:white_check_mark: Successfully removed the track \`${removedTrack.info.title}\` by \`${removedTrack.info.author}\``);
    }
}

module.exports = RemoveSong;