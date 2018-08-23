const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class NowPlaying extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'nowplaying',
                description: 'Check the currently playing song',
                usage: '{prefix}nowplaying'
            },
            conf: { aliases: ['np'] }
        }, { playing: true });
    }

    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        const genericEmbed = await this.genericEmbed(context.currentTrack, context.connection, 'Now playing');
        const node = context.client.config.options.music.nodes.find(n => n.host === context.connection.player.node.host);
        genericEmbed.fields.push({
            name: 'Node',
            value: `${node.countryEmote} ${node.location}`,
            inline: true
        });
        return context.message.channel.createMessage({ embed: genericEmbed });
    }
}

module.exports = NowPlaying;