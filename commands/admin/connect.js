const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class Connect extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'connect',
                description: 'Connect to the database, in case the bot was launched with the --no-db arg, this allow for a connection to the db',
                usage: '{prefix}connect'
            }
        });
    }

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        client.handlers.DatabaseWrapper = client.handlers.DatabaseWrapper ? client.handlers.DatabaseWrapper._reload() : new(require('../../handlers/DatabaseWrapper'))(client);
        return message.channel.createMessage('Welp I launched the connection process, can\'t do much more tho so check the console to see if it worked lul');
    }
}

module.exports = new Connect();