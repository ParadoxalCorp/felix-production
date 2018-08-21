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
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        return context.message.channel.createMessage('not used atm');
    }
}

module.exports = Dummy;