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
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        if (!context.args[0]) {
            return context.message.channel.createMessage('baguette tbh');
        }
        let toEval = context.args.join(' ').replace(/;\s+/g, ';\n').trim();
        const parsedArgs = this.parseArguments(context.args);
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
            return context.message.channel.createMessage("**Input:**\n```js\n" + toEval + "```\n**Output:**\n```js\n" + context.client.utils.helpers.redact(err) + "```");
        }
    }
}

module.exports = Eval;