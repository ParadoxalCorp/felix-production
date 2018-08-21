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
    /** @param {import("../../structures/Contexts/AdminContext")} context */
    
    async run(context) {
        if (context.client.handlers.DatabaseWrapper && context.client.handlers.DatabaseWrapper.healthy) {
            return context.message.channel.createMessage('Are you a baka? Im already connected to the database');
        }
        this.client.handlers.DatabaseWrapper = this.client.handlers.DatabaseWrapper 
            ? this.client.handlers.DatabaseWrapper._reload() 
            : new(require('../../handlers/DatabaseWrapper'))(this.client);
        return context.message.channel.createMessage('Welp I launched the connection process, can\'t do much more tho so check the console to see if it worked lul');
    }
}

module.exports = Connect;