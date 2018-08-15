'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class SeePlaylists extends MusicCommands {
    constructor(client) {
        super(client);
        this.help = {
            name: 'seeplaylists',
            description: 'See your saved playlists',
            usage: '{prefix}seeplaylists'
        };
        this.conf = this.genericConf({ requireDB: true });
    }
    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        const userPlaylists = await this.client.database.rethink.table("playlists").filter({userID: context.message.author.id}).run();
        if (!userPlaylists[0]) {
            return context.message.channel.createMessage(':x: You do not have any saved playlists :v, save one with the `saveplaylist` command');
        }
        return context.message.channel.createMessage({
            embed: {
                title: `:musical_note: ${context.message.author.username}'s saved playlists`,
                description: (() => {
                    let playlists = '\n';
                    for (const playlist of userPlaylists) {
                        playlists += `\`${playlist.name}\` (**${playlist.tracks.length}** tracks)\n**=>** ID: \`${playlist.id}\`\n\n`; 
                    }
                    return playlists;
                })(),
                footer: {
                    text: `To load a saved playlist, use "${this.getPrefix(context.guildEntry)}addplaylist <playlist_id>"`
                },
                color: 0x36393f
            }
        });
    }
}

module.exports = SeePlaylists;