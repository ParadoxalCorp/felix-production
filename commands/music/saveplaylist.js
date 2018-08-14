'use strict';

const MusicCommands = require('../../util/helpers/modules/musicCommands');

class SavePlaylist extends MusicCommands {
    constructor(client) {
        super(client)
        this.help = {
            name: 'saveplaylist',
            description: 'Save the current queue in your playlists, allowing you to load it whenever you want',
            usage: '{prefix}saveplaylist <name>'
        };
        this.conf = this.genericConf({ 
            aliases: ['ap'],
            requireDB: true,
            expectedArgs: [{
                description: 'Please specify the name you want to give to this playlist'
            }]
        });
    }
    /**
    * @param {import("../../util/helpers/modules/musicCommands.js").MusicContext} context The context
    */

    async run(context) {
        const queue = await this.client.musicManager.getQueueOf(context.message.channel.guild.id);
        if (!queue[0]) {
            return context.message.channel.createMessage(`:x: There's nothing in the queue to save :v`);
        }
        let userPlaylists = await this.client.database.rethink.table("playlists").get(context.message.author.id) || this.client.refs.userPlaylists(context.message.author.id);
        if (userPlaylists.playlists.length >= context.userEntry.tierLimits.maxSavedPlaylists) {
            return context.message.channel.createMessage(`:x: You have reached the limit of \`${context.userEntry.tierLimits.maxSavedPlaylists}\` saved playlists :v, you can delete one to save a new one or become a donator to increase the limit`);
        } else if (queue.length > context.userEntry.tierLimits.playlistSaveLimit) {
            return context.message.channel.createMessage(`:x: You can't save a playlist bigger than \`${context.userEntry.tierLimits.playlistSaveLimit}\` tracks :v, donators can save bigger playlists`);
        } else if (context.args.join(" ") > 84) {
            return context.message.channel.createMessage(`:x: The playlist name can't be longer than \`84\` characters :v`);
        }
        const playlistID = `${context.message.author.id}-${Date.now()}-${process.pid}`;
        userPlaylists.playlists.push(this.client.refs.userPlaylist(context.args.join(" "), playlistID, queue));
        await this.client.database.set(userPlaylists, 'playlists');
        return context.message.channel.createMessage(`:white_check_mark: Saved the queue as a playlist with the name \`${context.args.join(" ")}\`. This playlist's id is \`${playlistID}\``);
    }
}

module.exports = SavePlaylist;