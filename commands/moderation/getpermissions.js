const ModerationCommands = require('../../structures/CommandCategories/ModerationCommands');

class GetPermissions extends ModerationCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'getpermissions',
                description: 'Get the permissions set for the server, or for a channel category/channel/role/user',
                usage: '{prefix}getpermissions <global|category|channel|role|user> | <category_name|channel_name|role_name|username>',
                externalDoc: 'https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#permissions-system',
            },
            conf: {
                aliases: ['getperms', 'gp', 'getpermission'],
                requireDB: true,
                guildOnly: true,
            },
        });
    }
    /** @param {import("../../structures/Contexts/ModerationContext")} context */

    async run(context) {
        if (!this.validatePermissionTarget(context.args[0])) {
            if (typeof context.args[0] === 'undefined') {
                context.args[0] = 'global';
            } else {
                return context.message.channel.createMessage(':x: You must specify to what this permission should apply to with either `global`, `category`, `channel`, `role` or `user`. If you are lost, simply run this command like `' + context.prefix + this.help.name + '`');
            }
        }
        const target = await this.getPermissionTarget(context);
        if (!target) {
            return context.message.channel.createMessage(`:x: I couldn't find this ${context.args[0].toLowerCase()}`);
        }
        return this.getPermissions(context, {targetType: context.args[0].toLowerCase(), target});
    }

    async getPermissions(context, args) {
        let specialTargetCases = {
            global: 'global',
            category: 'categories'
        };
        let targetPerms = context.guildEntry.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`];
        if (Array.isArray(targetPerms)) {
            targetPerms = targetPerms.find(perms => perms.id === args.target.id);
        }
        if (!targetPerms) {
            return context.message.channel.createMessage(`:x: There is not any permissions set for the ${args.targetType} **${(args.target.name || args.target.tag)}**`);
        }
        const embed = this.formatPermissions(context, args, targetPerms);
        const withinLimits = embed.fields[0].value.length < 1024 && embed.fields[1].value.length < 1024;
        return context.message.channel.createMessage(withinLimits ? {embed} : '', !withinLimits ? this.formatToFile(context, embed, args) : null);
    }

    formatPermissions(context, args, targetPerms) {
        return {
            title: `${args.targetType === 'global' ? 'Global' : ''} Permissions ${args.targetType !== 'global' ? ('for the ' + args.targetType + ' ' + (args.target.name || args.target.tag)) : ''}`,
            color: context.client.config.options.embedColor.generic,
            fields: (() => {
                if (args.targetType === 'global') {
                    targetPerms.allowedCommands = targetPerms.allowedCommands.concat(context.client.structures.References.defaultPermissions.allowedCommands.map(perm => `${perm} (default)`));
                    targetPerms.restrictedCommands = targetPerms.restrictedCommands.concat(context.client.structures.References.defaultPermissions.restrictedCommands.map(perm => `${perm} (default)`));
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

    formatToFile(context, embed, args) {
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

module.exports = GetPermissions;