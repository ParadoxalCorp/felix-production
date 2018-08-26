const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class Pause extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'pause',
                description: 'Pause or resume the playback',
                usage: '{prefix}pause'
            }
        }, { userInVC: true, playing: true });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        context.connection.player.setPause(context.connection.player.paused ? false : true);
        return context.message.channel.createMessage(`:white_check_mark: Successfully ${context.connection.player.paused ? 'paused' : 'resumed'} the playback`);       
    }
}

module.exports = Pause;