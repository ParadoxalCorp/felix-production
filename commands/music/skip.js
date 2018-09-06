const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class Skip extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'skip',
                description: 'Start a vote to skip the currently playing song',
                usage: '{prefix}skip'
            },
            conf: { aliases: ['voteskip'] }
        }, { userInVC: true, playing: true });
    }
}

module.exports = Skip;