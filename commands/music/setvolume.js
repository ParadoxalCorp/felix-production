const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class SetVolume extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'setvolume',
                description: 'Donator only. Set the volume of the current playback, Accepted values are between 1 and 200',
                usage: '{prefix}setvolume <volume>'
            },
            aliases: ['setvol']
        }, { userInVC: true, playing: true, noArgs: ':x: You did not specify the volume to set' });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        if (!context.userEntry.hasPremiumStatus()) {
            return context.message.channel.createMessage(':x: I am terribly sorry but this command is restricted to donators :v, you can get a link to my patreon with the `bot` command');
        }
        let volume = context.args[0];
        if (!this.client.utils.isWholeNumber(volume) || volume > 200 || volume < 1) {
            return context.message.channel.createMessage(':x: The specified volume is invalid ! It must be a whole number between 1 and 200');
        }
        context.connection.player.setVolume(parseInt(volume));
        return context.message.channel.createMessage(`:white_check_mark: Successfully set the volume at \`${volume}\``);       
    }
}

module.exports = SetVolume;