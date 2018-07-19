'use strict';

const Command = require('../../util/helpers/modules/Command');

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
        client.database = client.database ? client.database._reload() : new(require('../../util/helpers/modules/databaseWrapper'))(client);
        return message.channel.createMessage('Welp I launched the connection process, can\'t do much more tho so check the console to see if it worked lul');
    }
}

module.exports = new Connect();