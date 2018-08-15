'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class DeletePlaylist extends MusicCommands {
    constructor(client) {
        super(client);
        this.help = {
            name: 'deleteplaylist',
            description: 'Delete one of your saved playlists',
            usage: '{prefix}deleteplaylist <playlist_id>'
        };
        this.conf = this.genericConf({ requireDB: true, expectedArgs: [{description: 'Please specify the ID of the playlist to delete'}] });
    }
    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        const playlist = await this.client.database.rethink.table("playlists").get(context.args[0]).run();
        if (!playlist) {
            return context.message.channel.createMessage(':x: I couldn\'t find any playlist with this ID');
        } else if (playlist.userID !== context.message.author.id) {
            return context.message.channel.createMessage(':x: You can\'t delete a playlist of someone else, that\'s like, bad');
        }
        await this.client.database.rethink.table("playlists").get(playlist.id).delete(playlist.id).run();
        return context.message.channel.createMessage(`:white_check_mark: Successfully deleted the playlist \`${playlist.name}\``);
    }
}

module.exports = DeletePlaylist;