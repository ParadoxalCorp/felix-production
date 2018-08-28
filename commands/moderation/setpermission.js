const ModerationCommands = require('../../structures/CommandCategories/ModerationCommands');

class SetPermission extends ModerationCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'setpermission',
                description: 'Set a new command/category permission for the server, or a channel category/channel/role/user. As always, you can run the command like `{prefix}setpermission` to be guided through the process',
                usage: '{prefix}setpermission <command_name|category_name*|*> | <true|false> | <global|category|channel|role|user> | <category_name|channel_name|role_name|username>',
                externalDoc: 'https://github.com/ParadoxalCorp/felix-production/blob/master/usage.md#permissions-system'
            },
            conf: {
                requireDB: true,
                aliases: ['setperm', 'sp'],
                guildOnly: true,
                expectedArgs: [{
                    description: 'What permission do you want to set, you can reply with a command name like `ping` to target this command, or the name of a command category followed by a `*` like `generic*` to target a whole category',
                    validate: (client, message, arg) => this.validatePermission(arg)
                }, {
                    description: 'Do you want to restrict or allow this permission, reply with `true` to allow it and `false` to restrict it',
                    possibleValues: [{
                        name: 'true',
                        interpretAs: 'true'
                    }, {
                        name: 'false',
                        interpretAs: 'false'
                    }]
                }, {
                    description: 'To what this permission should apply to, you can reply with `global` to target the entire server, `channel` to target a specific channel, `role` to target a specific role or `user` to target a specific user',
                    validate: (client, message, arg) => this.validateTarget(arg)
                }, {
                    description: `Please reply with the name of the target (channel/role/user) you want to apply this permission on`,
                    condition: (client, message, args) => args[2].toLowerCase() !== 'global'
                }]
            },
        });
    }
    /** @param {import("../../structures/Contexts/ModerationContext")} context */

    async run(context) {
        if (context.args.length < 3) {
            return context.message.channel.createMessage(`:x: You didn't specified enough arguments, if you are lost, just run \`${context.prefix}${this.help.name}\``);
        }
        if (!this.validatePermission(context.args[0])) {
            return context.message.channel.createMessage(':x: The permission must be a command name, like `ping`, or the name of a command category followed by a `*` like `generic*` to target a whole category. If you are lost, simply run this command like `' + context.prefix + this.help.name + '`');
        } else if (!['true', 'false'].includes(context.args[1].toLowerCase())) {
            return context.message.channel.createMessage(':x: You must specify whether to restrict or allow this permission with `true` or `false`. If you are lost, simply run this command like `' + context.prefix + this.help.name + '`');
        } else if (!this.validatePermissionTarget(context.args[2])) {
            return context.message.channel.createMessage(':x: You must specify to what this permission should apply to with either `global`, `category`, `channel`, `role` or `user`. If you are lost, simply run this command like `' + context.prefix + this.help.name + '`');
        }
        const target = await this.getPermissionTarget(context, 2);
        if (!target) {
            return context.message.channel.createMessage(`:x: I couldn't find this ${context.args[2].toLowerCase()}`);
        }
        let permission = context.client.aliases.has(context.args[0].toLowerCase()) ? context.client.aliases.get(context.args[0].toLowerCase()) : context.args[0].toLowerCase();
        return this.setPermission(context, {permission, override: context.args[1].toLowerCase() === 'true' ? true : false, targetType: context.args[2].toLowerCase(), target});
    }

    async setPermission(context, args) {
        let specialTargetCases = {
            global: 'global',
            category: 'categories'
        };
        let targetPerms = context.guildEntry.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`];
        if (Array.isArray(targetPerms)) {
            if (!targetPerms.find(perms => perms.id === args.target.id)) {
                targetPerms.push(context.client.structures.References.permissionsSet(args.target.id));
            }
            targetPerms = targetPerms.find(perms => perms.id === args.target.id);
        }
        if (targetPerms[args.override ? 'allowedCommands' : 'restrictedCommands'].includes(args.permission)) {
            return context.message.channel.createMessage(`:x: The permission \`${args.permission}\` is already ${args.override ? 'allowed' : 'restricted'} for this ${args.targetType === 'global' ? 'server' : args.targetType}`);
        }
        //If the permissions is already set to true/false; tl;dr the opposite, remove it, as the user obviously don't want to keep it
        let oppositePerm = targetPerms[args.override ? 'restrictedCommands' : 'allowedCommands'];
        if (oppositePerm.includes(args.permission)) {
            oppositePerm.splice(oppositePerm.findIndex(perm => perm === args.permission), 1);
        }
        targetPerms[args.override ? 'allowedCommands' : 'restrictedCommands'].push(args.permission);
        await context.guildEntry.save();
        return context.message.channel.createMessage(`:white_check_mark: Successfully ${args.override ? 'allowed' : 'restricted'} the permission \`${args.permission}\` for the ${args.targetType === 'global' ? 'server' : args.targetType} ${args.target.name || args.target.username ? ('**' + (args.target.name || args.target.tag) + '**') : ''}`);
    }
}

module.exports = SetPermission;