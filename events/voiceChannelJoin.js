'use strict';

class VoiceChannelJoin {
    constructor() {}

    async handle(client, member, channel) {
        const musicConnection = client.musicManager.connections.get(channel.guild.id);
        if (!musicConnection || musicConnection.player.channelId !== channel.id) {
            return;
        }
        if (channel.voiceMembers.size > 1 && musicConnection.inactivityTimeout) {
            return clearTimeout(musicConnection.inactivityTimeout);
        }
    }
}

module.exports = new VoiceChannelJoin();