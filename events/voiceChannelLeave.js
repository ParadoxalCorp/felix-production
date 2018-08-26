class VoiceChannelLeave {
    constructor() {}

    async handle(client, member, channel) {
        const musicConnection = client.handlers.MusicManager.connections.get(channel.guild.id);
        if (!musicConnection || musicConnection.player.channelId !== channel.id) {
            return;
        }
        if (channel.voiceMembers.size === 1) {
            return musicConnection.startInactivityTimeout();
        }
    }
}

module.exports = new VoiceChannelLeave();