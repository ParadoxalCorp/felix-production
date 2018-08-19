const { inspect } = require('util');
const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class Eval extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'eval',
                description: 'eval, i think it\'s fairly obvious at this point',
                usage: '{prefix}eval'
            }
        });
    }

    //eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        if (!args[0]) {
            return message.channel.createMessage('baguette tbh');
        }
        let toEval = args.join(' ').replace(/;\s+/g, ';\n').trim();
        const parsedArgs = client.commands.get('reload').parseArguments(args);
        for (const arg in parsedArgs) {
            toEval = toEval.replace(`--${arg + (typeof parsedArgs[arg] !== 'boolean' ? '=' + parsedArgs[arg] : '')}`, '');
        }
        try {
            let evaluated = parsedArgs['await'] ? await eval(toEval) : eval(toEval);
            throw evaluated;
        } catch (err) {
            if (typeof err !== 'string') {
                err = inspect(err, {
                    depth: parsedArgs['depth'] ? parseInt(parsedArgs['depth']) : this.getMaxDepth(err, toEval),
                    showHidden: true
                });
            }
            return message.channel.createMessage("**Input:**\n```js\n" + toEval + "```\n**Output:**\n```js\n" + client.utils.helpers.redact(err) + "```");
        }
    }

    getMaxDepth(toInspect, toEval) {
        let maxDepth = 0;
        for (let i = 0; i < 10; i++) {
            if (inspect(toInspect, { depth: i }).length > (1980 - toEval.length)) {
                return i - 1;
            } else {
                maxDepth++;
            }
        }
        return maxDepth;
    }
}

module.exports = new Eval();