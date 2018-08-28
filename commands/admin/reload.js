const { inspect } = require('util');
const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class Reload extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'reload',
                description: 'Reload a module - This command use a command-line like syntax for its parameters, as in, parameters looks like `--<parameter_name>`. Parameters can have a value, the syntax for specifying a value for a parameter is `--<parameter_name>=<value>`\n\nExample: `reload ./module.js --module --bindToClient=moduleBaguette --instantiate`\nThe above example reload the file `module.js` at the root of this command\'s folder, instantiate it without additional parameters and add it as a propriety of the client class under the name `moduleBaguette`',
                usage: '{prefix}reload <file_path> <params>',
            }
        });
    }
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        if (['utils', 'handlers', 'commands', 'structures', 'events'].includes(context.args[0].toLowerCase())) {
            const reload = await context.client.handlers.IPCHandler.broadcastReload(context.args[0].toLowerCase()).then(() => 'success').catch(err => err);
            if (reload === 'success') {
                return context.message.channel.createMessage(`:white_check_mark: Successfully reloaded all ${context.args[0].toLowerCase()}`);
            } else {
                return context.message.channel.createMessage('```js\n' + inspect(reload, {depth: 2}) + '```');
            }
        }
        const isPath = new RegExp(/\/|\\/gim).test(context.args[0]);
        const command = context.client.commands.get(context.args[0]) || context.client.commands.get(context.client.aliases.get(context.args[0]));
        const path = context.args[0] === 'all' || this.verifyPath(context.args.includes('--command') && !isPath ? `../${command.category.name.toLowerCase()}/${command.help.name}` : context.args[0]);
        if (!path) {
            return context.message.channel.createMessage(':x: Look, i don\'t want to be mean, but this is NOT a valid path, try again');
        }
        const fileName = typeof path === 'string' ? path.split(/\/|\\/gm)[path.split(/\/|\\/gm).length - 1].split('.')[0] : false;

        if (context.args.includes('--event')) {
            const reloadedEvent = await context.client.handlers.IPCHandler.broadcastReload('event', context.args[0] === 'all' ? context.args[0] : path)
                .then(() => {
                    if (context.args[0] === 'all') {
                        return context.message.channel.createMessage(`:white_check_mark: Successfully reloaded all events listeners\n\n:warning: Don't forget to reload all modules now, to add back their listeners`);
                    }
                    return context.message.channel.createMessage(`:white_check_mark: Successfully reloaded/added the \`${fileName}\` event listener\n\n:warning: Don't forget to reload all modules now, to add back their listeners`);
                })
                .catch(err => {
                    return context.message.channel.createMessage({
                        embed: {
                            description: 'So, at least one cluster reported that the reload failed, here\'s the list scrub ```js\n' + inspect(err, { depth: 2 }) + '```'
                        }
                    });
                });
            return reloadedEvent;
        } else if (context.args.includes('--command')) {
            if (context.args[0] !== 'all' && (command && command.conf.subCommand)) {
                return context.message.channel.createMessage(`:x: Sorry cutie, but this is a sub-command, so the only way to reload it is to re-generate it`);
            }
            const reloadedCommand = await context.client.handlers.IPCHandler.broadcastReload('command', context.args[0] === 'all' ? context.args[0] : path)
                .then(() => {
                    if (context.args[0] === 'all') {
                        return context.message.channel.createMessage(':white_check_mark: Successfully reloaded all commands');
                    }
                    return context.message.channel.createMessage(`:white_check_mark: Successfully reloaded/added the command \`${fileName}\``);
                })
                .catch(err => {
                    return context.message.channel.createMessage({
                        embed: {
                            description: 'So, at least one clusters reported that the reload failed, here\'s the list scrub ```js\n' + inspect(err, { depth: context.client.commands.get('eval').getMaxDepth(err, 'So, at least one clusters reported that the reload failed, here\'s the list scrub') }) + '```'
                        }
                    });
                });
            return reloadedCommand;
        } else if (context.args.includes('--module')) {
            const reloadedModule = await context.client.handlers.IPCHandler.broadcastReload('module', context.args[0] === 'all' ? context.args[0] : path, fileName, this.parseArguments(context.args))
                .then(() => {
                    if (context.args[0] === 'all') {
                        return context.message.channel.createMessage(':white_check_mark: Successfully reloaded all modules');
                    }
                    return context.message.channel.createMessage(`:white_check_mark: Successfully reloaded/added the module \`${fileName}\``);
                })
                .catch(err => {
                    return context.message.channel.createMessage({
                        embed: {
                            description: 'So, at least one clusters reported that the reload failed, here\'s the list scrub ```js\n' + inspect(err, { depth: 2 }) + '```'
                        }
                    });
                });
            return reloadedModule;
        }
        return context.message.channel.createMessage(`Hoi, this is not valid syntax, try again kthx`);
    }

    verifyPath(path) {
        let resolvedPath;
        try {
            resolvedPath = require.resolve(path);
        }
        // eslint-disable-next-line no-empty
        catch (err) {}

        return resolvedPath;
    }
}

module.exports = Reload;