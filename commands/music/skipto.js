const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class SkipTo extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'skipto',
                description: 'Start a vote to skip to the specified position in the queue',
                usage: '{prefix}skipto <position>'
            },
            conf: { aliases: ['voteskipto'] }
        }, { userInVC: true, playing: true });
    }
}

module.exports = SkipTo;