const GenericCommands = require('../../structures/CommandCategories/GenericCommands');

class Help extends GenericCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'help',
                description: 'Display the list of available commands or get more details on a specific command.\n\nYou can use the `--noEmbed` and `--dm` options to respectively send the help without embed and send it in your direct messages. Like `{prefix}help --noEmbed`, note that those options are case-insensitive and can be combined',
                usage: '{prefix}help',
            },
            conf: {
                aliases: ["halp"]
            },
        });
    }
    
    extra (context) {
        let info = `Hey ! Update ${context.client.package.version} is out ! Check out the [changelog](https://github.com/ParadoxalCorp/felix-production/blob/master/changelog.md)\n`;
        info += `Have a few minutes to fill a survey ? If so, how about [filling this survey](https://goo.gl/forms/bl9pk7qLAl5WDJ2y2)?\n`;
        info += `You can find a detailed documentation [here](https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md)`;
        return info;
    }

    /** @param {import("../../structures/Contexts/GenericContext")} context */  

    async run(context) {
        const noEmbed = new RegExp(/--noEmbed/gim).test(context.args.join(" "));
        const dm = new RegExp(/--dm/gim).test(context.args.join(" "));
        //If a command name is specified (ignore arguments), get this command help, otherwise get the general help
        /** @type {any} */
        let helpMessage = !context.args.filter(a => !a.startsWith('--'))[0] ? this.getOverallHelp(context) : this.getCommandHelp(context.client, context.message, context.args, context.guildEntry);

        if (!helpMessage) {
            return;
        }

        if (dm) {
            context.message.author.getDMChannel().then(channel => {
                channel.createMessage(noEmbed ? helpMessage.normalMessage : helpMessage.embedMessage)
                    .catch(() => {
                        return context.message.channel.createMessage(`:x: I couldn't send you a direct message, you might have your DMs disabled. You should in this case enable them if you want me to send you a direct message.`);
                    });
            });
        } else {
            return context.message.channel.createMessage(noEmbed ? helpMessage.normalMessage : helpMessage.embedMessage);
        }
    }

    /** @param {import("../../structures/Contexts/GenericContext")} context */  

    getOverallHelp(context) {
        const categories = [];

        this.client.commands.forEach(c => {
            if (!categories.includes(c.help.category || c.category.name) && (this.client.config.admins.includes(context.message.author.id) || (c.help.category || c.category.name) !== "admin")) {
                categories.push(c.help.category || c.category.name);
            }
        });

        return {
            embedMessage: {
                embed: {
                    title: ":book: Available commands",
                    description: `Here is the list of all available commands and their categories, you can use commands like \`${this.getPrefix(context.client, context.guildEntry)}<command>\`\n\n${this.extra(context)}`,
                    fields: categories.map(c => {
                        const firstCommandInCategory = this.client.commands.find(cmd => (cmd.help.category || cmd.category.name) === c);
                        const subCategories = this.getSubCategories(this.client);
                        const value = subCategories[0] 
                            ? subCategories.map(sc => `**${sc}**: ${this.client.commands.filter(command => command.help.subCategory === sc).map(command => '`' + command.help.name + '`').join(" ")}`).join('\n\n')
                            : this.client.commands.filter(command => (command.help.category || command.category.name) === c).map(command => `\`${command.help.name}\``).join(" ");
                        return {
                            name: `${c} ${firstCommandInCategory.category ? firstCommandInCategory.category.emote : ''}`,
                            value: value
                        };
                    }),
                    footer: {
                        text: `For a total of ${this.client.commands.size} commands`
                    },
                    color: this.client.config.options.embedColor.generic
                }
            },
            normalMessage: `Here is the list of all available commands and their categories, you can use commands like \`${this.getPrefix(context.client, context.guildEntry)}<command>\`\n\n${categories.map(c => '**' + c + '** =>' + this.client.commands.filter(command => (command.help.category || command.category.name) === c).map(command => '\`' + command.help.name + '\`').join(', ')).join('\n\n')}`
        };
    }

    getCommandHelp(client, message, args, guildEntry) {
        const commandName = args.filter(a => !a.startsWith('--'))[0];
        const command = client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
        if (!command) {
            return false;
        }
        
        return {
            embedMessage: this.getEmbedCommandHelp(client, message, args, command, guildEntry),
            normalMessage: this.getNormalCommandHelp(client, message, args, command, guildEntry)
        };
    }

    getEmbedCommandHelp(client, message, args, command, guildEntry) {
        
        const embedFields = [{
            name: 'Category',
            value: command.help.category || command.category.name,
            inline: true
        }, {
            name: 'Usage',
            value: '`' + command.help.usage.replace(/{prefix}/gim, this.getPrefix(client, guildEntry)) + '`',
            inline: true
        }];
        if (command.help.params) {
            let paramsList = "";
            for (const key in command.help.params) {
                if (typeof command.help.params[key] === "string") {
                    paramsList += `\`${key}\`: ${command.help.params[key]}\n\n`;
                } else {
                    paramsList += `\`${key}\`: ${command.help.params[key].description}\n**=>Possible values:** (${command.help.params[key].mandatoryValue ?  'A value is mandatory' : 'The value isn\'t mandatory'})\n`;
                    for (const element of command.help.params[key].values) {
                        paramsList += `==>\`${element.name}\`: ${element.description}\n`;
                    }
                    paramsList += "\n"; //Bonus new-line
                }
            }
            // @ts-ignore
            embedFields.push({
                name: 'Parameters',
                value: paramsList 
            });
        }
        if (command.conf.aliases[0]) {
            // @ts-ignore
            embedFields.push({
                name: 'Aliases',
                value: command.conf.aliases.map(a => `\`${a}\``).join(" ")
            });
        }
        if (command.conf.requirePerms[0]) {
            embedFields.push({
                name: 'Require permissions',
                value: command.conf.requirePerms.map(p => `\`${p}\``).join(" "),
                inline: true
            });
        }
        if (command.conf.guildOwnerOnly) {
            embedFields.push({
                name: 'Owner only',
                value: 'This command can only be used by the owner of the server',
                inline: true
            });
        }
        if (command.conf.guildOnly) {
            embedFields.push({
                name: 'Server only',
                value: 'This command cannot be used in DMs',
                inline: true
            });
        }
        if (command.help.externalDoc) {
            // @ts-ignore
            embedFields.push({
                name: 'External documentation',
                value: `This command has an external documentation available [here](${command.help.externalDoc})`
            });
        }
        return {
            embed: {
                title: `:book: Help for the ${command.help.name} command`,
                description: command.help.description.replace(/{prefix}/gim, this.getPrefix(client, guildEntry)),
                fields: embedFields,
                color: client.config.options.embedColor.generic,
                image: command.help.preview ? {
                    url: command.help.preview
                } : undefined
            }
        };
    }

    getNormalCommandHelp(client, message, args, command, guildEntry) {
        //Focusing highly on readability here, one-lining this would look like hell
        let normalHelp = `**Description**: ${command.help.description.replace(/{prefix}/gim, this.getPrefix(client, guildEntry))}\n`;
        normalHelp += `**Category**: ${command.help.category || command.category.name}\n`;
        normalHelp += `**Usage**: \`${command.help.usage.replace(/{prefix}/gim, this.getPrefix(client, guildEntry))}\`\n`;
        if (command.conf.aliases[0]) {
            normalHelp += `**Aliases**: ${command.conf.aliases.map(a => '\`' + a + '\`').join(', ')}\n`;
        }
        if (command.conf.requirePerms) {
            normalHelp += `**Require permissions**: ${command.conf.requirePerms.map(p => '\`' + p + '\`').join(', ')}\n`;
        }
        if (command.conf.guildOwnerOnly) {
            normalHelp += '**Owner only:** This command can only be used by the owner of the server';
        }
        if (command.conf.guildOnly) {
            normalHelp += '**Server only:** This command cannot be used in DMs';
        }
        if (command.help.params) {
            for (const key in command.help.params) {
                if (typeof command.help.params[key] === "string") {
                    normalHelp += `\`${key}\`: ${command.help.params[key]}\n\n`;
                } else {
                    normalHelp += `\`${key}\`: ${command.help.params[key].description}\n**=>Possible values:** (${command.help.params[key].mandatoryValue ?  'A value is mandatory' : 'The value isn\'t mandatory'})\n`;
                    for (const element of command.help.params[key].values) {
                        normalHelp += `==>\`${element.name}\`: ${element.description}\n`;
                    }
                    normalHelp += "\n"; //Bonus new-line
                }
            }
        }
        if (command.help.externalDoc) {
            normalHelp += `**External documentation**: <${command.help.externalDoc}>`;
        }
        
        return normalHelp;
    }

    getSubCategories(client) {
        let subCategories = [];
        for (const value of client.commands) {
            const cmd = value[1];
            if (cmd.help.category === this.category) {
                if (cmd.help.subCategory && !subCategories.includes(cmd.help.subCategory)) {
                    subCategories.push(cmd.help.subCategory);
                }
            }
        }
        return subCategories;
    }

    getPrefix(client, guildEntry) {
        return guildEntry && guildEntry.prefix ? (guildEntry.prefix + (guildEntry.spacedPrefix ? ' ' : '')) : `${client.config.prefix} `;
    }
}

module.exports = Help;