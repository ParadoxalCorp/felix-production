'use strict';

/**   
* @typedef {import("../../../main.js")} Client
*/

const Command = require('./Command');

class MusicCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {{noArgs: string, userInVC: boolean, autoJoin: boolean, playing: boolean}} [options={}]  - `noArgs` specify a message to return if no arguments are provided, `userInVC` checks if the member is in a voice channel, `autoJoin` automatically joins the voice channel if not in, `playing` checks if Felix is playing. These args will make the command handler act before running the command
     */
    constructor(client, options = {}) {
        super();
        this.client = client;
        this.options = options;
        this.category = {
            name: 'Music',
            emote: ':musical_note: :new:',
            genericConf: {
                guildOnly: true,
                requirePerms: ['voiceConnect', 'voiceSpeak']
            }
        };
    }

    //eslint-disable-next-line no-unused-vars
    async initialCheck(message, args, guildEntry, userEntry) {
        const member = message.channel.guild.members.get(message.author.id);
        const clientMember = message.channel.guild.members.get(this.client.bot.user.id);
        if (!guildEntry.hasPremiumStatus()) {
            return message.channel.createMessage(':x: Sorry but as they are resources-whores, music commands are only available to our patreon donators. Check the `bot` command for more info');
        }
        else if (this.options.noArgs && !args[0]) {
            return message.channel.createMessage(this.options.noArgs);
        } else if (this.options.userInVC && (clientMember.voiceState.channelID && clientMember.voiceState.channelID !== member.voiceState.channelID)) {
            return message.channel.createMessage(':x: You must be connected in a voice channel with me to use that');
        } else if (this.options.autoJoin && !clientMember.voiceState.channelID) {
            if (Array.isArray(this.clientHasPermissions(message, this.client, ['voiceConnect', 'voiceSpeak'], message.channel.guild.channels.get(member.voiceState.channelID)))) {
                return message.channel.createMessage(':x: It seems like I lack the permission to connect or to speak in the voice channel you are in :c');
            }
        }
        if (this.options.playing) {
            const connection = this.client.musicManager.connections.get(message.channel.guild.id);
            if (!connection || !connection.nowPlaying) {
                return message.channel.createMessage(':x: I am not playing anything');
            }
        }
        return { passed: true };
    }

    isValidPosition(position, queue) {
        return !position || !this.client.isWholeNumber(position) || (position - 1 >= queue.length) || (position - 1 < 0) ? false : true;
    }

    genericConf(commandConf = {}) {
        return Object.assign(this.commandsConf, this.category.genericConf, commandConf);
    }
}

module.exports = MusicCommands;