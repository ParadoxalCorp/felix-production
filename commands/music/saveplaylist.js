const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class SavePlaylist extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'saveplaylist',
                description: 'Save the current queue in your playlists, allowing you to load it whenever you want',
                usage: '{prefix}saveplaylist <name>'
            },
            conf: {
                requireDB: true,
                expectedArgs: [{
                    description: 'Please specify the name you want to give to this playlist'
                }]
            }
        });
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        const queue = await this.client.handlers.MusicManager.getQueueOf(context.message.channel.guild.id);
        if (!queue[0]) {
            return context.message.channel.createMessage(`:x: There's nothing in the queue to save :v`);
        }
        const userPlaylists = await this.client.handlers.DatabaseWrapper.rethink.table("playlists").filter({userID: context.message.author.id}).run();
        if (userPlaylists.length >= context.userEntry.tierLimits.maxSavedPlaylists) {
            return context.message.channel.createMessage(`:x: You have reached the limit of \`${context.userEntry.tierLimits.maxSavedPlaylists}\` saved playlists :v, you can delete one to save a new one or become a donator to increase the limit`);
        } else if (queue.length > context.userEntry.tierLimits.playlistSaveLimit) {
            return context.message.channel.createMessage(`:x: You can't save a playlist bigger than \`${context.userEntry.tierLimits.playlistSaveLimit}\` tracks :v, donators can save bigger playlists`);
        } else if (context.args.join(" ") > 84) {
            return context.message.channel.createMessage(`:x: The playlist name can't be longer than \`84\` characters :v`);
        }
        const playlistID = `${context.message.author.id}-${Date.now()}-${process.pid}`;
        await this.client.handlers.DatabaseWrapper.set(this.client.structures.References.userPlaylist(context.args.join(" "), playlistID, context.message.author.id, queue), 'playlists');
        return context.message.channel.createMessage(`:white_check_mark: Saved the queue as a playlist with the name \`${context.args.join(" ")}\`. This playlist's id is \`${playlistID}\``);
    }
}

module.exports = SavePlaylist;