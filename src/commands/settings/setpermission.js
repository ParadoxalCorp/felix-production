const Command = require("../../structures/Command");

module.exports = class SetPermission extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            if (!ctx.validatePermission(ctx.args.permission)) {
                return ctx.sendLocale("setpermission.invalid-permission");
            } 
            const target = await ctx.getPermissionTarget();
            if (!target) {
                return ctx.sendLocale("setpermission.target-not-found", { target: ctx.args.targetType.toLowerCase() });
            }
            let permission = ctx.client.aliases.has(ctx.args.permission.toLowerCase()) ? ctx.client.aliases.get(ctx.args[0].toLowerCase()) : ctx.args[0].toLowerCase();
            const args = {
                permission,
                override: ctx.args.toggle === "true" ? true : false,
                targetType: ctx.args.targetType,
                target: ctx.args.target
            }
            let specialTargetCases = {
                global: 'global',
                category: 'categories'
            };
            let targetPerms = ctx.guildEntry.props.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`];
            if (Array.isArray(targetPerms)) {
                if (!targetPerms.find(perms => perms.id === args.target.id)) {
                    targetPerms.push(ctx.client.structures.References.permissionsSet(args.target.id));
                }
                targetPerms = targetPerms.find(perms => perms.id === args.target.id);
            }
            if (targetPerms[args.override ? 'allowedCommands' : 'restrictedCommands'].includes(args.permission)) {
                return ctx.msg.channel.createMessage(`:x: The permission \`${args.permission}\` is already ${args.override ? 'allowed' : 'restricted'} for this ${args.targetType === 'global' ? 'server' : args.targetType}`);
            }
            //If the permissions is already set to true/false; tl;dr the opposite, remove it, as the user obviously don't want to keep it
            let oppositePerm = targetPerms[args.override ? 'restrictedCommands' : 'allowedCommands'];
            if (oppositePerm.includes(args.permission)) {
                oppositePerm.splice(oppositePerm.findIndex(perm => perm === args.permission), 1);
            }
            targetPerms[args.override ? 'allowedCommands' : 'restrictedCommands'].push(args.permission);
            await ctx.guildEntry.save();
            if (args.override) {
                return ctx.sendLocale('setpermission.success-allowed', { permission: args.permission, targetType: args.targetType === 'global' ? 'server' : args.targetType, target: args.target.name || args.target.username ? ('**' + (args.target.name || args.target.tag) + '**') : '' });
            } else {
                return ctx.sendLocale('setpermission.success-disallowed', { permission: args.permission, targetType: args.targetType === 'global' ? 'server' : args.targetType, target: args.target.name || args.target.username ? ('**' + (args.target.name || args.target.tag) + '**') : '' });
            }
        });
        this.setName("setpermission")
            .setDescription("Shows the latency between the bot and Discord")
            .setAliases(["setperm", "sp"])
            .setExpectedArgs("permission:string toggle:(true|false) targetType:(global|channel|category|role|user) target:user_resolvable");
    }
};