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

    async run(client, message, args) {
        if (['utils', 'handlers', 'commands', 'structures'].includes(args[0].toLowerCase())) {
            return message.channel.createMessage(`:white_check_mark: Successfully reloaded all ${args[0].toLowerCase()}`);
        }
        const isPath = new RegExp(/\/|\\/gim).test(args[0]);
        const command = client.commands.get(args[0]) || client.commands.get(client.aliases.get(args[0]));
        const path = args[0] === 'all' || this.verifyPath(args.includes('--command') && !isPath ? `../${(command.help.category || command.category.name).toLowerCase()}/${command.help.name}` : args[0]);
        if (!path) {
            return message.channel.createMessage(':x: Look, i don\'t want to be mean, but this is NOT a valid path, try again');
        }
        const fileName = typeof path === 'string' ? path.split(/\/|\\/gm)[path.split(/\/|\\/gm).length - 1].split('.')[0] : false;

        if (args.includes('--event')) {
            const reloadedEvent = await client.handlers.IPCHandler.broadcastReload('event', args[0] === 'all' ? args[0] : path)
                .then(() => {
                    if (args[0] === 'all') {
                        return message.channel.createMessage(`:white_check_mark: Successfully reloaded all events listeners\n\n:warning: Don't forget to reload all modules now, to add back their listeners`);
                    }
                    return message.channel.createMessage(`:white_check_mark: Successfully reloaded/added the \`${fileName}\` event listener\n\n:warning: Don't forget to reload all modules now, to add back their listeners`);
                })
                .catch(err => {
                    return message.channel.createMessage({
                        embed: {
                            description: 'So, at least one cluster reported that the reload failed, here\'s the list scrub ```js\n' + inspect(err, { depth: 2 }) + '```'
                        }
                    });
                });
            return reloadedEvent;
        } else if (args.includes('--command')) {
            if (args[0] !== 'all' && (command && command.conf.subCommand)) {
                return message.channel.createMessage(`:x: Sorry cutie, but this is a sub-command, so the only way to reload it is to re-generate it`);
            }
            const reloadedCommand = await client.handlers.IPCHandler.broadcastReload('command', args[0] === 'all' ? args[0] : path)
                .then(() => {
                    if (args[0] === 'all') {
                        return message.channel.createMessage(':white_check_mark: Successfully reloaded all commands');
                    }
                    return message.channel.createMessage(`:white_check_mark: Successfully reloaded/added the command \`${fileName}\``);
                })
                .catch(err => {
                    return message.channel.createMessage({
                        embed: {
                            description: 'So, at least one clusters reported that the reload failed, here\'s the list scrub ```js\n' + inspect(err, { depth: client.commands.get('eval').getMaxDepth(err, 'So, at least one clusters reported that the reload failed, here\'s the list scrub') }) + '```'
                        }
                    });
                });
            return reloadedCommand;
        } else if (args.includes('--module')) {
            const reloadedModule = await client.handlers.IPCHandler.broadcastReload('module', args[0] === 'all' ? args[0] : path, fileName, this.parseArguments(args))
                .then(() => {
                    if (args[0] === 'all') {
                        return message.channel.createMessage(':white_check_mark: Successfully reloaded all modules');
                    }
                    return message.channel.createMessage(`:white_check_mark: Successfully reloaded/added the module \`${fileName}\``);
                })
                .catch(err => {
                    return message.channel.createMessage({
                        embed: {
                            description: 'So, at least one clusters reported that the reload failed, here\'s the list scrub ```js\n' + inspect(err, { depth: 2 }) + '```'
                        }
                    });
                });
            return reloadedModule;
        }
        return message.channel.createMessage(`Hoi, this is not valid syntax, try again kthx`);
    }

    parseArguments(args) {
        const parsedArgs = {};
        args.forEach(arg => {
            if (!arg.includes('--')) {
                return;
            }
            parsedArgs[arg.split('--')[1].split('=')[0].toLowerCase()] = arg.includes('=') ? arg.split('=')[1] : true;
        });
        return parsedArgs;
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

module.exports = new Reload();