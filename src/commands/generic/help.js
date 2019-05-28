/** @typedef {import("../../structures/Context")} context */
/** @typedef {import("../../structures/Command")} command */
const Command = require("../../structures/Command");

module.exports = class Help extends Command {
    constructor(client) {
        super(client, async (ctx) => {

            // const user = await ctx.fetchUser()
            // const target = user || ctx.msg.author;

            const args = ctx.args

            const ArgsLCase = Object.values(args).map(value => value.toLowerCase())

            console.log(Object.values(args));
            
            

            console.log({ args });

            console.log({ArgsLCase});
            


            const noEmbed = ArgsLCase.includes("--noembed")
            const dm = ArgsLCase.includes("--dm")

            //If a command name is specified (ignore arguments), get this command help, otherwise get the general help

            console.log({dm, noEmbed });
            

            let helpMessage = 
            !Object.values(args).filter(a => !a.startsWith('--'))[0] ? this.getOverallHelp(ctx, ctx.member.id) : this.getCommandHelp(ctx);
            
            // args[Object.keys(args).filter(key => args[key] && !args[key].includes("--"))[0]] ? this.getOverallHelp(ctx, ctx.member.id) : this.getCommandHelp(ctx);

            console.log({ helpMessage });
            


            if (dm) {
                ctx.msg.author.getDMChannel().then(channel => {
                    channel.createMessage(noEmbed ? helpMessage.normalMessage : helpMessage.embedMessage)
                        .catch(() => {
                            return `:x: I couldn't send you a direct message, you might have your DMs disabled. You should in this case enable them if you want me to send you a direct context.message.`
                        });
                });
            } else {
                return ctx.msg.channel.createMessage(noEmbed ? helpMessage.normalMessage : helpMessage.embedMessage);
            }
        });
        this.setName("help")
            .setDescription("Display the list of available commands or get more details on a specific command.\n\nYou can use the `--noEmbed` and `--dm` options to respectively send the help without embed and send it in your direct messages. Like `{prefix}help --noEmbed`, note that those options are case-insensitive and can be combined")
            .setExpectedArgs("param1:string* param2:string* param3:string*")
    }


    /**
     * @param {context} context 
     * @returns 
     */
    getCommandHelp(context) {
        const commandName = Object.keys(context.args).filter(key => !context.args[key].includes("--"))[0]
        const command = context.client.commands.get(commandName) || context.client.commands.get(context.client.aliases.get(commandName))

        if (!command) {
            return false;
        }

        return {
            embedMessage: this.getEmbedCommandHelp(context, command),
            normalMessage: this.getNormalCommandHelp(context, command)
        };
    }



    /**
     * @param {context} context 
     * @returns 
     */
    getOverallHelp(context, userID) {
        /** @type {Array<string>} */
        const categories = [];
        const commands= [];

        
        for (var command of this.client.commands) {
            // console.log(command[0]);
            commands.push(this.client.commands.get(command[0]));
            

            // console.log(this.client.commands.get(command[0]).category );
            

            if (!categories.includes(this.client.commands.get(command[0]).category) && (process.env.ADMINS.includes(userID) || !command.hidden)) {
                categories.push(this.client.commands.get(command[0]).category);
            }
        }

        return {
            embedMessage: {
                embed: {
                    title: ":book: Available commands",
                    description: `Here is the list of all available commands and their categories.`,
                    fields: categories.map(category => {

                        const value = commands.filter( command => command.category === category).map(command => `\`${command.name}\``).join(" ")

                        return {
                            name: `${category}`,
                            value: value
                        }
                    }),
                    footer: {
                        text: `For a total of ${context.client.commands.size} commands`
                    },
                    color: Number(process.env.EMBED_COLOR)
                }
            },
            normalMessage: `Here is the list of all available commands and their categories, you can use commands like \`${context.guildEntry.prefix}<command>\`\n\n${categories.map(c => '**' + c + '** =>' + context.client.commands.filter(command => command.category === c).map(command => '\`' + command.name + '\`').join(', ')).join('\n\n')}`
        };
    }

    /**
     * @param {context} context 
     * @param {command} command
     * @returns 
     */
    getNormalCommandHelp(context, command) {
        //Focusing highly on readability here, one-lining this would look like hell
        let normalHelp = `**Description**: ${command.description}\n`;
        normalHelp += `**Category**: ${command.category}\n`;
        // normalHelp += `**Usage**: \`${command.usage.replace(/{prefix}/gim, context.guildEntry.prefix)}\`\n`;
        if (command.aliases[0]) {
            normalHelp += `**Aliases**: ${command.aliases.map(a => '\`' + a + '\`').join(', ')}\n`;
        }
        if (command.requiredPerms) {
            normalHelp += `**Require permissions**: ${command.requiredPerms.map(p => '\`' + p + '\`').join(', ')}\n`;
        }
        if (command.guildOwnerOnly) {
            normalHelp += '**Owner only:** This command can only be used by the owner of the server';
        }
        if (command.guildOnly) {
            normalHelp += '**Server only:** This command cannot be used in DMs';
        }

        return normalHelp;
    }

    /**
     * @param {context} context 
     * @param {command} command
     * @returns 
     */
    getEmbedCommandHelp(context, command) {
        const embedFields = [{
            name: 'Category',
            value: command.category,
            inline: true
        }
            // {
            //     name: 'Usage',
            //     value: '`' + command.help.usage.replace(/{prefix}/gim, context.guildEntry.prefix) + '`',
            //     inline: true
            // }
        ];
        // if (command.help.params) {
        //     let paramsList = "";
        //     for (const key in command.help.params) {
        //         if (typeof command.help.params[key] === "string") {
        //             paramsList += `\`${key}\`: ${command.help.params[key]}\n\n`;
        //         } else {
        //             paramsList += `\`${key}\`: ${command.help.params[key].description}\n**=>Possible values:** (${command.help.params[key].mandatoryValue ? 'A value is mandatory' : 'The value isn\'t mandatory'})\n`;
        //             for (const element of command.help.params[key].values) {
        //                 paramsList += `==>\`${element.name}\`: ${element.description}\n`;
        //             }
        //             paramsList += "\n"; //Bonus new-line
        //         }
        //     }
        //     // @ts-ignore
        //     embedFields.push({
        //         name: 'Parameters',
        //         value: paramsList
        //     });
        // }
        if (command.aliases[0]) {
            embedFields.push({
                name: 'Aliases',
                value: command.aliases.map(a => `\`${a}\``).join(" "),
                inline: false
            });
        }
        if (command.requiredPerms[0]) {
            embedFields.push({
                name: 'Require permissions',
                value: command.requiredPerms.map(p => `\`${p}\``).join(" "),
                inline: true
            });
        }
        if (command.guildOwnerOnly) {
            embedFields.push({
                name: 'Owner only',
                value: 'This command can only be used by the owner of the server',
                inline: true
            });
        }
        if (command.guildOnly) {
            embedFields.push({
                name: 'Server only',
                value: 'This command cannot be used in DMs',
                inline: true
            });
        }
        // if (command.help.externalDoc) {
        //     // @ts-ignore
        //     embedFields.push({
        //         name: 'External documentation',
        //         value: `This command has an external documentation available [here](${command.help.externalDoc})`
        //     });
        // }
        return {
            embed: {
                title: `:book: Help for the ${command.name} command`,
                description: command.description.replace(/{prefix}/gim, context.guildEntry.prefix),
                fields: embedFields,
                color: Number(process.env.EMBED_COLOR),
                image: command.preview ? {
                    url: command.preview
                } : undefined
            }
        };
    }

}


