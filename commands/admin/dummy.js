const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class Dummy extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'dummy',
                description: 'dummy',
                usage: '{prefix}dummy'
            }
        });
    }

    async run(client, message) {
        return message.channel.createMessage('wew');
    }
}

module.exports = new Dummy();