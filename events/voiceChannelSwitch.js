class VoiceChannelSwitch {
    constructor() {}

    async handle(client, member, newChannel, oldChannel) {
        const musicConnection = client.handlers.MusicManager.connections.get(oldChannel.guild.id);
        if (!musicConnection || (member.id !== client.bot.user.id && musicConnection.player.channelId !== oldChannel.id)) {
            return;
        }
        //Clear the timeout if there is one and that the bot is switching to a channel with users in
        if (musicConnection.inactivityTimeout && client.bot.user.id === member.id && newChannel.voiceMembers.size > 1) {
            return clearTimeout(musicConnection.inactivityTimeout);
        } else if (oldChannel.voiceMembers.size === 1) {
            return musicConnection.startInactivityTimeout();
        }
    }
}

module.exports = new VoiceChannelSwitch();