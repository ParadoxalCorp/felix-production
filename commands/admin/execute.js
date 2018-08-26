const { inspect } = require('util');
const AdminCommands = require('../../structures/CommandCategories/AdminCommands');
const { exec } = require('child_process');

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
        }, { noArgs: 'baguette tbh' });
    }
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        exec(context.args.join(' '), (error, stdout) => {
            const outputType = error || stdout;
            let output = outputType;
            if (typeof outputType === 'object') {
                output = inspect(outputType, {
                    depth: this.getMaxDepth(outputType, context.args.join(' '))
                });
            }
            output = context.client.utils.helpers.redact(output.length > 1980 ? output.substr(0, 1977) + '...' : output);
            return context.message.channel.createMessage('```\n' + output + '```');
            exec.kill();
        });
    }
}

module.exports = Execute;