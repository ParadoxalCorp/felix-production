const SettingsCommands = require('../../structures/CommandCategories/SettingsCommands');

class SimulateGreetings extends SettingsCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'simulategreetings',
                description: 'Simulate the greetings with you as the new member',
                usage: '{prefix}simulategreetings'
            },
            conf: {
                requireDB: true,
                guildOnly: true,
            }
        });
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        if (!guildEntry.greetings.enabled) {
            return message.channel.createMessage(':x: The greetings are not enabled');
        }
        if (!guildEntry.greetings.message) {
            return message.channel.createMessage(':x: There is no greetings message set');
        }
        if (!guildEntry.greetings.channel || (guildEntry.greetings.channel !== 'dm' && !message.channel.guild.channels.has(guildEntry.greetings.channel))) {
            return message.channel.createMessage(':x: The greetings\'s message target is not set');
        }
        //Backward compatibility, see issue #33 (https://github.com/ParadoxalCorp/felix-production/issues/33)
        if ((guildEntry.greetings.channel !== 'dm') && (message.channel.guild.channels.get(guildEntry.greetings.channel).type !== 0)) {
            return message.channel.createMessage(':x: The greetings\'s message target is not a text channel, you should change it to a text channel in order for greetings to work');
        }
        client.bot.emit('guildMemberAdd', message.channel.guild, message.channel.guild.members.get(message.author.id));
        return message.channel.createMessage(client.commands.get('setgreetings')._checkPermissions(client, message, guildEntry));
    }
}

module.exports = new SimulateGreetings();