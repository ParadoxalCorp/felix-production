'use strict';

const Command = require('../../structures/Command');

class Connect extends Command {
    constructor() {
        super();
        this.help = {
            name: 'connect',
            category: 'admin',
            description: 'Connect to the database, in case the bot was launched with the --no-db arg, this allow for a connection to the db',
            usage: '{prefix}connect'
        };
        this.conf = {
            requireDB: false,
            disabled: false,
            aliases: [],
            requirePerms: [],
            guildOnly: false,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        client.handlers.DatabaseWrapper = client.handlers.DatabaseWrapper ? client.handlers.DatabaseWrapper._reload() : new(require('../../handlers/DatabaseWrapper'))(client);
        return message.channel.createMessage('Welp I launched the connection process, can\'t do much more tho so check the console to see if it worked lul');
    }
}

module.exports = new Connect();