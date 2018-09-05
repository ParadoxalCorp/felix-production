const Command = require('../structures/Command');

class MessageHandler {
    constructor() {
        this.ratelimited = new Map();
        this.commandCooldownDuration = 25000;
        this._sweepInterval = setInterval(this._sweep.bind(this), this.commandCooldownDuration);
        this.defaultCooldownWeight = 5;
        this.maxCooldownWeight = 20;
        this.latestSweep = Date.now();
    }

    async handle(client, message) {
        if (!message.author || message.author.bot) {
            return;
        }
        const databaseEntries = await this.getDatabaseEntries(client, message);
        if (databaseEntries.user && databaseEntries.user.blackListed) {
            return;
        }
        if (databaseEntries.guild) {
            client.handlers.ExperienceHandler.handle(message, databaseEntries.guild, databaseEntries.user);
        }
        const command = await Command.parseCommand(message, client);
        if (!command) {
            return;
        }
        if (command.conf.disabled) {
            return message.channel.createMessage(`:x: Sorry but this command is disabled at the moment\nReason: ${command.conf.disabled}`);
        }
        if (command.conf.guildOnly && !message.channel.guild) {
            return message.channel.createMessage(`:x: This command may only be used in guilds and not in private messages`);
        }
        if ((!databaseEntries.user || (!databaseEntries.guild && command.conf.guildOnly)) && command.conf.requireDB) {
            return message.channel.createMessage(`:x: Sorry but this command require the database and the database seems unavailable at the moment`);
        }
        const clientHasPermissions = message.channel.guild ? Command.clientHasPermissions(message, client, ['embedLinks', ...command.conf.requirePerms]) : true;
        if (Array.isArray(clientHasPermissions)) {
            if (clientHasPermissions.includes("sendMessages")) {
                return;
            }
            return message.channel.createMessage(`:x: I need the following permission(s) to run that command: ` + clientHasPermissions.map(p => `\`${p}\``).join(', ')).catch(() => {});
        }
        const memberHasPermissions = await this.memberHasPermissions(client, message, databaseEntries, command);
        if (!memberHasPermissions) {
            return message.channel.createMessage(`:x: You don't have the permission to use this command`).catch(() => {});
        }
        if (this.ratelimited.has(message.author.id) && this.ratelimited.get(message.author.id) >= this.maxCooldownWeight) {
            return message.channel.createMessage(`:x: Hoi hoi chill a little, there, a ${Math.ceil((this.latestSweep + this.commandCooldownDuration - Date.now()) / 1000)} second(s) cooldown for you :heart:`);
        }
        this.runCommand(client, message, command, databaseEntries);
    }

    async getDatabaseEntries(client, message) {
        const databaseEntries = {
            user: null,
            guild: null
        };
        const handleRejection = (err) => {
            client.bot.emit('error', err, message, false);
        };
        if (!client.handlers.DatabaseWrapper || !client.handlers.DatabaseWrapper.healthy) {
            return databaseEntries;
        }
        if (message.channel.guild) {
            await Promise.all([client.handlers.DatabaseWrapper.getUser(message.author.id), client.handlers.DatabaseWrapper.getGuild(message.channel.guild.id)])
                .then(entries => {
                    databaseEntries.user = entries[0].id === message.author.id ? entries[0] : entries[1];
                    databaseEntries.guild = entries[0].id === message.channel.guild.id ? entries[0] : entries[1];
                })
                .catch(handleRejection);
        } else {
            await client.handlers.DatabaseWrapper.getUser(message.author.id)
                .then(user => databaseEntries.user = user)
                .catch(handleRejection);
        }
        return databaseEntries;
    }

    async memberHasPermissions(client, message, databaseEntries, command) {
        let allowed = false;
        if (!databaseEntries.guild) {
            allowed = this._checkDefaultPermissions(client, message, command);
        } else {
            allowed = databaseEntries.guild.memberHasPermission(message.author.id, command, message.channel);
        }
        if (message.channel.guild && command.conf.guildOwnerOnly && (message.author.id !== message.channel.guild.ownerID)) {
            allowed = false;
        }
        return allowed;
    }

    _checkDefaultPermissions(client, message, command) {
        let allowed;

        if (client.structures.References.defaultPermissions.allowedCommands.includes(`${command.category.name}*`)) {
            allowed = true;
        }
        if (client.structures.References.defaultPermissions.restrictedCommands.includes(`${command.category.name}*`)) {
            allowed = false;
        }
        if (client.structures.References.defaultPermissions.allowedCommands.includes(command.help.name)) {
            allowed = true;
        }
        if (client.structures.References.defaultPermissions.restrictedCommands.includes(command.help.name)) {
            allowed = false;
        }

        if (message.channel.guild && message.channel.guild.members.get(message.author.id).permission.has("administrator")) {
            allowed = true;
        }

        if (command.category.name === "admin") {
            if (client.config.admins.includes(message.author.id)) {
                allowed = command.conf.ownerOnly && client.config.ownerID !== message.author.id ? false : true;
            } else {
                allowed = false;
            }
        }

        return allowed;
    }

    async runCommand(client, message, command, databaseEntries) {
        let queryMissingArgs;
        let args;
        const toSplice = databaseEntries.guild ? (databaseEntries.guild.spacedPrefix || message.content.startsWith(`<@${client.bot.user.id}>`) || message.content.startsWith(`<@!${client.bot.user.id}`) ? 2 : 1) : 2;
        if (message.content.includes('|')) {
            args = [message.content.split(/\|/g).splice(0, 1)[0].split(/\s+/g).splice(toSplice).join(' ').trim(), ...message.content.split(/\|/g).splice(1).map(a => a.trim())];
        }
        args = args || message.content.split(/\s+/gim).splice(toSplice);
        if (!args[0] && command.conf.expectedArgs[0]) {
            await Command.queryMissingArgs(client, message, command)
                .then(args => {
                    if (args) {
                        queryMissingArgs = args;
                    }
                })
                .catch(err => {
                    client.bot.emit('error', err, message);
                });
        }
        if (!queryMissingArgs && !args[0] && command.conf.expectedArgs[0]) {
            return;
        }
        const initialCheck = await command.initialCheck(client, message, queryMissingArgs || args, databaseEntries.guild, databaseEntries.user).catch(err => client.bot.emit('error', err, message));
        if (!initialCheck.passed) {
            return;
        }
        const categoryCheck = command.categoryCheck ? await command.categoryCheck(initialCheck.context) : undefined;
        if (categoryCheck && !categoryCheck.passed) {
            return;
        }
        //If the category check returned a function to call back, call it, otherwise call the command's run method
        (categoryCheck && categoryCheck.callback ? categoryCheck.callback.bind(command) : command.run.bind(command))(initialCheck.context)
            .catch(err => client.bot.emit('error', err, message));
        this.handleCooldown(client, message, command);
    }

    handleCooldown(client, message, command) {
        const commandCooldownWeight = typeof command.conf.cooldownWeight === 'undefined' ? this.defaultCooldownWeight : command.conf.cooldownWeight;
        if (!client.config.admins.includes(message.author.id)) {
            this.ratelimited.set(message.author.id, this.ratelimited.get(message.author.id) ? 
                (this.ratelimited.get(message.author.id) + commandCooldownWeight) 
                : commandCooldownWeight);
        }
            
    }

    _sweep() {
        this.ratelimited = new Map();
        this.latestSweep = Date.now();
    }

}

module.exports = new MessageHandler();