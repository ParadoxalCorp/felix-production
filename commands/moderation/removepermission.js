const ModerationCommands = require('../../structures/CommandCategories/ModerationCommands');

class RemovePermission extends ModerationCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'removepermission',
                description: '**Remove** (not restrict) a set command/category permission from the server, or from a channel category/channel/role/user. As always, you can run the command like `{prefix}removepermission` to be guided through the process',
                usage: '{prefix}removepermission <command_name|category_name*|*> | <global|category|channel|role|user> | <category_name|channel_name|role_name|username>',
                externalDoc: 'https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#permissions-system'
            },
            conf: {
                requireDB: true,
                aliases: ['removeperm', 'rp'],
                guildOnly: true,
                expectedArgs: [{
                    description: 'What permission do you want to remove, you can reply with a command name like `ping` to target this command, or the name of a command category followed by a `*` like `generic*` to target a whole category',
                    validate: (client, message, arg) => this.validatePermission(arg)
                }, {
                    description: 'From what this permission should be removed? You can reply with `global` to target the entire server, `category` to target a channel category, `channel` to target a specific channel, `role` to target a specific role or `user` to target a specific user',
                    validate: (client, message, arg) => this.validatePermissionTarget(arg)
                }, {
                    description: `Please reply with the name of the target (category/channel/role/user) you want to remove this permission from`,
                    condition: (client, message, args) => args[1].toLowerCase() !== 'global'
                }],
            },
        });
    }
    /** @param {import("../../structures/Contexts/ModerationContext")} context */

    async run(context) {
        if (!this.validatePermissionTarget(context.args[1])) {
            return context.message.channel.createMessage(':x: You must specify from what this permission should be removed with either `global`, `category`, `channel`, `role` or `user`. If you are lost, simply run this command like `' + context.prefix + this.help.name + '`');
        }
        const target = await this.getPermissionTarget(context, 1);
        if (!target) {
            return context.message.channel.createMessage(`:x: I couldn't find this ${context.args[1].toLowerCase()}`);
        }
        let permission = context.client.aliases.has(context.args[0].toLowerCase()) ? context.client.aliases.get(context.args[0].toLowerCase()) : context.args[0].toLowerCase();
        return this.removePermission(context, {permission, targetType: context.args[1].toLowerCase(), target});
    }

    async removePermission(context, args) {
        const targetPerms = this.getTargetPerms(context, args);
        if (!targetPerms || (!targetPerms.allowedCommands.includes(args.permission) && !targetPerms.restrictedCommands.includes(args.permission))) {
            return context.message.channel.createMessage(`:x: The permission \`${args.permission}\` is neither restricted nor allowed on this ${args.targetType === 'global' ? 'server' : args.targetType}`);
        }
        let restricted;
        if (targetPerms.allowedCommands.includes(args.permission)) {
            targetPerms.allowedCommands.splice(targetPerms.allowedCommands.findIndex(perm => perm === args.permission), 1);
        } else {
            targetPerms.restrictedCommands.splice(targetPerms.allowedCommands.findIndex(perm => perm === args.permission), 1);
            restricted = true;
        }
        //Delete the permission group if empty
        if (args.targetType !== 'global' && !targetPerms.allowedCommands[0] && !targetPerms.restrictedCommands[0]) {
            let group = context.guildEntry.permissions[this.specialTargetCases[args.targetType] || `${args.targetType}s`];
            group.splice(group.findIndex(perms => perms.id === args.target.id));
        }
        await context.guildEntry.save();
        return context.message.channel.createMessage(`:white_check_mark: Successfully removed the permission \`${args.permission}\` which was ${restricted ? 'restricted' : 'allowed'} on the ${args.targetType === 'global' ? 'server' : args.targetType} ${args.target.name || args.target.username ? ('**' + (args.target.name || args.target.tag) + '**') : ''}`);
    }
}

module.exports = RemovePermission;