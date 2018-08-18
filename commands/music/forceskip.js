const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class ForceSkip extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'forceskip',
                description: 'Force skip the currently playing song',
                usage: '{prefix}forceskip'
            },
            conf: { aliases: ['fskip'] }
        }, { userInVC: true, playing: true });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        const skippedSong = context.connection.skipTrack();
        return context.message.channel.createMessage(`:white_check_mark: Skipped \`${skippedSong.info.title}\` by \`${skippedSong.info.author}\``);       
    }
}

module.exports = ForceSkip;