'use strict';

const Command = require('../../structures/Command');

class GetPermissions extends Command {
    constructor() {
        super();
        this.help = {
            name: 'getpermissions',
            category: 'moderation',
            description: 'Get the permissions set for the server, or for a channel/role/user',
            usage: '{prefix}getpermissions <global|channel|role|user> | <channel_name|role_name|username>',
            externalDoc: 'https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#permissions-system'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: ['getperms', 'gp', 'getpermission'],
            requirePerms: [],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars 
    async run(client, message, args, guildEntry, userEntry) {
        const getPrefix = client.commands.get('help').getPrefix;
        if (!this.validateTarget(args[0])) {
            if (typeof args[0] === 'undefined') {
                args[0] = 'global';
            } else {
                return message.channel.createMessage(':x: You must specify to what this permission should apply to with either `global`, `category`, `channel`, `role` or `user`. If you are lost, simply run this command like `' + getPrefix(client, guildEntry) + this.help.name + '`');
            }
        }
        let target = args[0].toLowerCase() === 'global' ? 'global' : null;
        let targetType = args[0].toLowerCase();
        if (['category', 'channel'].includes(targetType)) {
            target = await this.getChannelFromText({client, message, text: args.slice(1).join(' '), type: targetType === 'channel' ? 'text' : 'category'});
        } else if (targetType === 'role') {
            target = await this.getRoleFromText({client, message, text: args.slice(1).join(' ')});
        } else if (targetType === 'user') {
            target = await this.getUserFromText({client, message, text: args.slice(1).join(' ')});
        }
        if (!target) {
            return message.channel.createMessage(`:x: I couldn't find this ${targetType}`);
        }
        return this.getPermissions(client, message, guildEntry, {targetType, target});
    }

    validateTarget(arg) {
        return arg ? ['global', 'category', 'channel', 'role', 'user'].includes(arg.toLowerCase()) : false;
    }

    async getPermissions(client, message, guildEntry, args) {
        let specialTargetCases = {
            global: 'global',
            category: 'categories'
        };
        let targetPerms = guildEntry.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`];
        if (Array.isArray(targetPerms)) {
            targetPerms = targetPerms.find(perms => perms.id === args.target.id);
        }
        if (!targetPerms) {
            return message.channel.createMessage(`:x: There is not any permissions set for the ${args.targetType} **${(args.target.name || new client.structures.ExtendedUser(args.target).tag, client.bot)}**`);
        }
        const embed = this.formatPermissions(client, message, guildEntry, args, targetPerms);
        const withinLimits = embed.fields[0].value.length < 1024 && embed.fields[1].value.length < 1024;
        return message.channel.createMessage(withinLimits ? {embed} : '', !withinLimits ? this.formatToFile(client, message, embed, args) : null);
    }

    formatPermissions(client, message, guildEntry, args, targetPerms) {
        return {
            title: `${args.targetType === 'global' ? 'Global' : ''} Permissions ${args.targetType !== 'global' ? ('for the ' + args.targetType + ' ' + (args.target.name || new client.structures.ExtendedUser(args.target).tag), client.bot) : ''}`,
            color: client.config.options.embedColor,
            fields: (() => {
                if (args.targetType === 'global') {
                    targetPerms.allowedCommands = targetPerms.allowedCommands.concat(client.structures.References.defaultPermissions.allowedCommands.map(perm => `${perm} (default)`));
                    targetPerms.restrictedCommands = targetPerms.restrictedCommands.concat(client.structures.References.defaultPermissions.restrictedCommands.map(perm => `${perm} (default)`));
                }
                return [{
                    name: 'Allowed permissions',
                    value: targetPerms.allowedCommands[0] ? '```diff\n' + targetPerms.allowedCommands.map(perm => `+ ${perm}`).join('\n') + '```' : ':x: None set'
                }, {
                    name: 'Restricted permissions',
                    value: targetPerms.restrictedCommands[0] ? '```diff\n' + targetPerms.restrictedCommands.map(perm => `- ${perm}`).join('\n') + '```' : ':x: None set'
                }];
            })()
        };
    }

    formatToFile(client, message, embed, args) {
        let content = 'Allowed permissions:\n';
        content += embed.fields[0].value.replace(/\`\`\`diff/g, '').replace(/\+/g, '').replace(/\`\`\`/g, '');
        content += '\nRestricted permissions:\n';
        content += embed.fields[1].value.replace(/\`\`\`diff/g, '').replace(/\-/g, '').replace(/\`\`\`/g, '');
        return { 
            file: Buffer.from(content),
            name: `${args.targetType === 'global' ? 'Global' : ''} Permissions ${args.targetType !== 'global' ? ('for the ' + args.targetType + ' ' + (args.target.name || args.target.username)) : ''}.txt`
        };
    }
}

module.exports = new GetPermissions();