const { inspect } = require('util');
const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class Execute extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'execute',
                description: 'execute, i think it\'s fairly obvious at this point',
                usage: '{prefix}execute'
            },
            conf: {
                aliases: ['exec', 'shell'],
            }
        });
    }

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        if (!args[0]) {
            return message.channel.createMessage('baguette tbh');
        }
        const { exec } = require('child_process');
        exec(args.join(' '), (error, stdout) => {
            const outputType = error || stdout;
            let output = outputType;
            if (typeof outputType === 'object') {
                output = inspect(outputType, {
                    depth: client.commands.get('eval').getMaxDepth(outputType, args.join(' '))
                });
            }
            output = client.utils.utils.redact(output.length > 1980 ? output.substr(0, 1977) + '...' : output);
            return message.channel.createMessage('```js\n' + output + '```');
            exec.kill();
        });
    }
}

module.exports = new Execute();