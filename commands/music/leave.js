const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class Leave extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'leave',
                description: 'Stop playing and leave the voice channel',
                usage: '{prefix}leave'
            }
        }, { userInVC: true });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        if (!context.clientVC) {
            return context.message.channel.createMessage(':x: I am not in any voice channel');
        }
        return context.connection ? context.connection.leave() : context.clientVC.leave();
    }
}

module.exports = Leave;