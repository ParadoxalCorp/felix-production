//Stolen from Tweetcord (https://github.com/Aetheryx/tweetcord) the 20/03/18

const { inspect } = require('util');
const { createContext, runInContext } = require('vm');
const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class Repl extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'repl',
                usage: '{prefix}repl',
                description: 'Owner only, use `.exit` to exit, `.clear` to clear variables, `//` to ignore a message and `_` to get the last statement',
            }
        });
    }
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        const builtinLibs = (() => {
            const libs = {};
            const { _builtinLibs } = require('repl');

            for (const lib in _builtinLibs) {
                libs[_builtinLibs[lib]] = require(_builtinLibs[lib]);
            }

            return libs;
        })();

        const getContext = () => {
            const ctx = {
                ...this.client,
                ...builtinLibs,
                require,
                Buffer,
                __dirname,
                clearInterval,
                clearTimeout
            };

            createContext(ctx);
            return ctx;
        };

        let ctx = getContext();

        let lastRanCommandOutput;
        let statementQueue = [];
        let openingBrackets = 0;
        let closingBrackets = 0;

        context.message.channel.createMessage('REPL started. Available commands:\n```\n.exit\n.clear\n_\n```');
        const runCommand = async() => {
            const commandMsg = await context.client.handlers.MessageCollector.awaitMessage(context.message.channel.id, context.message.author.id, 240e3);
            if (!commandMsg) {
                return context.message.channel.createMessage('Timed out, automatically exiting REPL...');
            }

            let { content } = commandMsg;

            if (content.startsWith('//')) {
                return runCommand();
            }
            if (content === '.exit') {
                return context.message.channel.createMessage('Successfully exited.');
            }
            if (content === '.clear') {
                ctx = getContext;
                statementQueue = [];
                context.message.channel.createMessage('Successfully cleared variables.');
                return runCommand();
            }

            ctx.message = commandMsg;
            ctx._ = lastRanCommandOutput;

            if (content.endsWith('}') && statementQueue[0]) {
                closingBrackets++;
                if (closingBrackets === openingBrackets) {
                    // Matching Closing and Opening brackets - we consume the statement queue
                    statementQueue.push(content);
                    content = statementQueue.join('\n');
                    statementQueue = [];
                    closingBrackets = 0;
                    openingBrackets = 0;
                } else {
                    statementQueue.push(content);
                    context.message.channel.createMessage(`\`\`\`js\n${statementQueue.join('\n')}\n  ...\n\`\`\``);
                    return runCommand();
                }
            } else if (content.endsWith('{') || statementQueue[0]) {
                if (content.endsWith('{')) {
                    openingBrackets++;
                }
                if (content.endsWith('}') || content.startsWith('}')) {
                    closingBrackets++;
                }
                // Opening bracket - we either open the statement queue or append to it
                statementQueue.push(content.endsWith('{') ?
                    content :
                    '  ' + content); // Indentation for appended statements
                context.message.channel.createMessage(`\`\`\`js\n${statementQueue.join('\n')}\n  ...\n\`\`\``);
                return runCommand();
            }

            let result;
            try {
                result = await runInContext(content, ctx, {
                    filename: 'aetheryx.repl'
                });

                lastRanCommandOutput = result;

                if (typeof result !== 'string') {
                    result = inspect(result, {
                        depth: +!(inspect(result, { depth: 1 }).length > 1990), // Results in either 0 or 1
                        showHidden: true
                    });
                }
            } catch (e) {
                const error = e.stack || e;
                result = `ERROR:\n${typeof error === 'string' ? error : inspect(error, { depth: 1 })}`;
            }

            context.message.channel.createMessage('```js\n' + context.client.utils.helpers.redact(result) + '\n```');

            runCommand();
        };

        runCommand();
    }
}

module.exports = Repl;