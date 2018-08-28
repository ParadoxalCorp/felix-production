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

    get additionalInfo() {
        let info = `Hey ! Update ${this.client.package.version} is out ! Check out the [changelog](https://github.com/ParadoxalCorp/felix-production/blob/master/changelog.md)\n`;
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
        let helpMessage = !context.args.filter(a => !a.startsWith('--'))[0] ? this.getOverallHelp(context) : this.getCommandHelp(context);

        if (!helpMessage) {
            return;
        }

        if (dm) {
            context.message.author.getDMChannel().then(channel => {
                channel.createMessage(noEmbed ? helpMessage.normalMessage : helpMessage.embedMessage)
                    .catch(() => {
                        return context.message.channel.createMessage(`:x: I couldn't send you a direct message, you might have your DMs disabled. You should in this case enable them if you want me to send you a direct context.message.`);
                    });
            });
        } else {
            return context.message.channel.createMessage(noEmbed ? helpMessage.normalMessage : helpMessage.embedMessage);
        }
    }

    getOverallHelp(context) {
        const categories = [];

        context.client.commands.forEach(c => {
            if (!categories.includes(c.category.name) && (context.client.config.admins.includes(context.message.author.id) || !c.conf.hidden)) {
                categories.push(c.category.name);
            }
        });

        return {
            embedMessage: {
                embed: {
                    title: ":book: Available commands",
                    description: `Here is the list of all available commands and their categories, you can use commands like \`${context.prefix}<command>\`\n\n${this.additionalInfo}`,
                    fields: categories.map(c => {
                        const firstCommandInCategory = context.client.commands.find(cmd => cmd.category.name === c);
                        const subCategories = this.getSubCategories(c);
                        const value = subCategories[0] 
                            ? subCategories.map(sc => `**${sc}**: ${context.client.commands.filter(command => command.help.subCategory === sc).map(command => '`' + command.help.name + '`').join(" ")}`).join('\n\n')
                            : context.client.commands.filter(command => command.category.name === c).map(command => `\`${command.help.name}\``).join(" ");
                        return {
                            name: `${c} ${firstCommandInCategory.category ? this.parseCategoryEmotes(context, firstCommandInCategory.category.emote) : ''}`,
                            value: value
                        };
                    }),
                    footer: {
                        text: `For a total of ${context.client.commands.size} commands`
                    },
                    color: context.client.config.options.embedColor.generic
                }
            },
            normalMessage: `Here is the list of all available commands and their categories, you can use commands like \`${context.prefix}<command>\`\n\n${categories.map(c => '**' + c + '** =>' + context.client.commands.filter(command => command.category.name === c).map(command => '\`' + command.help.name + '\`').join(', ')).join('\n\n')}`
        };
    }

    getCommandHelp(context) {
        const commandName = context.args.filter(a => !a.startsWith('--'))[0];
        const command = context.client.commands.get(commandName) || context.client.commands.get(context.client.aliases.get(commandName));
        if (!command) {
            return false;
        }
        
        return {
            embedMessage: this.getEmbedCommandHelp(context, command),
            normalMessage: this.getNormalCommandHelp(context, command)
        };
    }

    getEmbedCommandHelp(context, command) {      
        const embedFields = [{
            name: 'Category',
            value: command.category.name,
            inline: true
        }, {
            name: 'Usage',
            value: '`' + command.help.usage.replace(/{prefix}/gim, context.prefix) + '`',
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
                description: command.help.description.replace(/{prefix}/gim, context.prefix),
                fields: embedFields,
                color: context.client.config.options.embedColor.generic,
                image: command.help.preview ? {
                    url: command.help.preview
                } : undefined
            }
        };
    }

    getNormalCommandHelp(context, command) {
        //Focusing highly on readability here, one-lining this would look like hell
        let normalHelp = `**Description**: ${command.help.description.replace(/{prefix}/gim, context.prefix)}\n`;
        normalHelp += `**Category**: ${command.category.name}\n`;
        normalHelp += `**Usage**: \`${command.help.usage.replace(/{prefix}/gim, context.prefix)}\`\n`;
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

    getSubCategories(category) {
        let subCategories = [];
        for (const value of this.client.commands) {
            const cmd = value[1];
            if (cmd.category.name === category) {
                if (cmd.help.subCategory && !subCategories.includes(cmd.help.subCategory)) {
                    subCategories.push(cmd.help.subCategory);
                }
            }
        }
        return subCategories;
    }

    parseCategoryEmotes(context, emotes) {
        const emotesList = emotes.split(/\s+/g);
        let parsedEmotes = '';
        for (const emote of emotesList) {
            parsedEmotes += `${context.emote(emote)} `;
        }
        return parsedEmotes;
    }
}

module.exports = Help;