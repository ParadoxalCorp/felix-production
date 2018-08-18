const Command = require('../../structures/Command');

class SimulateFarewells extends Command {
    constructor() {
        super();
        this.help = {
            name: 'simulatefarewells',
            category: 'settings',
            description: 'Simulate the farewells with you as the leaving member',
            usage: '{prefix}simulatefarewells'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: [],
            requirePerms: [],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        if (!guildEntry.farewells.enabled) {
            return message.channel.createMessage(':x: The farewell are not enabled');
        }
        if (!guildEntry.farewells.message) {
            return message.channel.createMessage(':x: There is no farewell message set');
        }
        if (!guildEntry.farewells.channel || (guildEntry.farewells.channel !== 'dm' && !message.channel.guild.channels.has(guildEntry.farewells.channel))) {
            return message.channel.createMessage(':x: The farewell\'s message target is not set');
        }
        //Backward compatibility, see issue #33 (https://github.com/ParadoxalCorp/felix-production/issues/33)
        if (message.channel.guild.channels.get(guildEntry.farewells.channel).type !== 0) {
            return message.channel.createMessage(':x: The farewell\'s message target is not a text channel, you should change it to a text channel in order for farewells to work');
        }
        client.bot.emit('guildMemberRemove', message.channel.guild, message.channel.guild.members.get(message.author.id));
        return message.channel.createMessage(client.commands.get('setfarewells')._checkPermissions(client, message, guildEntry));
    }
}

module.exports = new SimulateFarewells();