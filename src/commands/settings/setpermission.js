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
                return ctx.sendLocale("generic.target-not-found", { target: `$t(keywords.${ctx.args.targetType.toLowerCase()})` });
            }
            let permission = ctx.client.aliases.has(ctx.args.permission.toLowerCase()) ? ctx.client.aliases.get(ctx.args.permission.toLowerCase()) : ctx.args.permission.toLowerCase();
            const args = {
                permission,
                override: ctx.args.toggle === "true" ? true : false,
                targetType: ctx.args.targetType.toLowerCase(),
                target: target
            };
            let specialTargetCases = {
                global: "global",
                category: "categories"
            };
            let targetPerms = ctx.guildEntry.props.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`];
            if (Array.isArray(targetPerms)) {
                if (!targetPerms.find(perms => perms.id === args.target.id)) {
                    targetPerms.push(ctx.client.models.permissionsSet(args.target.id));
                }
                targetPerms = targetPerms.find(perms => perms.id === args.target.id);
            }
            if (targetPerms[args.override ? "allowedCommands" : "restrictedCommands"].includes(args.permission)) {
                return ctx.sendLocale("setpermission.already-set", { set: `$t(keywords.${args.override ? "allowed" : "disallowed"})`, permission: args.permission, targetType: args.targetType === "global" ? "$t(keywords.server)" : `$t(keywords.${args.targetType})` });
            }
            //If the permissions is already set to true/false; tl;dr the opposite, remove it, as the user obviously don't want to keep it
            let oppositePerm = targetPerms[args.override ? "restrictedCommands" : "allowedCommands"];
            if (oppositePerm.includes(args.permission)) {
                oppositePerm.splice(oppositePerm.findIndex(perm => perm === args.permission), 1);
            }
            targetPerms[args.override ? "allowedCommands" : "restrictedCommands"].push(args.permission);
            await ctx.guildEntry.update({ $set: { [`permissions.${specialTargetCases[args.targetType] || args.targetType + "s"}`]: ctx.guildEntry.props.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`] } }).save();
            return ctx.sendLocale("setpermission.success", { 
                toggle: `$t(keywords.${args.override ? "allowed" : "disallowed"})`, 
                permission: args.permission, 
                targetType: args.targetType === "global" ? "$t(keywords.server)" : `$t(keywords.${args.targetType})`, 
                target: args.target.name || args.target.username ? ("**" + (args.target.name || args.target.tag) + "**") : "" 
            });
        });
        this.setName("setpermission")
            .setDescription("Set a channel/category/role/user or global permission")
            .setAliases(["setperm", "sp"])
            .setExpectedArgs("permission:string toggle:(true|false) targetType:(global|channel|category|role|user) target:user_resolvable*");
    }
};