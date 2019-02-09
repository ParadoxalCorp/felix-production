// @ts-nocheck
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
            let permission = ctx.client.aliases.has(ctx.args.permission.toLowerCase()) ? ctx.client.aliases.get(ctx.args.permission.toLowerCase()) : ctx.args.permission.toLowerCase();
            const args = {
                permission,
                targetType: ctx.args.targetType,
                target: target
            };
            let specialTargetCases = {
                global: "global",
                category: "categories"
            };
            let targetPerms = ctx.guildEntry.props.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`];
            if (Array.isArray(targetPerms)) {
                targetPerms = targetPerms.find(perms => perms.id === args.target.id);
            }
            if (!targetPerms || (!targetPerms.allowedCommands.includes(args.permission) && !targetPerms.restrictedCommands.includes(args.permission))) {
                return ctx.sendLocale("removepermission.notset", { permission: permission, targetType: args.targetType === "global" ? "$t(keywords.server)" : `$t(keywords.${args.targetType})` });
            }
            let restricted;
            if (targetPerms.allowedCommands.includes(args.permission)) {
                targetPerms.allowedCommands.splice(targetPerms.allowedCommands.findIndex(perm => perm === args.permission), 1);
            } else {
                targetPerms.restrictedCommands.splice(targetPerms.allowedCommands.findIndex(perm => perm === args.permission), 1);
                restricted = true;
            }
            //Delete the permission group if empty
            if (args.targetType !== "global" && !targetPerms.allowedCommands[0] && !targetPerms.restrictedCommands[0]) {
                let group = ctx.guildEntry.props.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`];
                group.splice(group.findIndex(perms => perms.id === args.target.id));
            }
            await ctx.guildEntry.update({ $set: { [`permissions.${specialTargetCases[args.targetType] || args.targetType + "s"}`]: ctx.guildEntry.props.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`] } }).save();
            return ctx.sendLocale("removepermission.success", { 
                permission: args.permission, 
                set: `$t(keywords.${restricted ? "disallowed" : "allowed"})`, 
                targetType: args.targetType === "global" ? "$t(keywords.server)" : `$t(keywords.${args.targetType})`, 
                target: args.target.name || args.target.username ? ("**" + (args.target.name || args.target.tag) + "**") : "" 
            });
        });
        this.setName("removepermission")
            .setDescription("Remove a channel/category/role/user or global permission")
            .setAliases(["removeperm", "rp"])
            .setExpectedArgs("permission:string targetType:(global|channel|category|role|user) target:user_resolvable*");
    }
};