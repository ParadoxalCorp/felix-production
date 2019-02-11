// @ts-nocheck
const Command = require("../../structures/Command");

module.exports = class GetPermissions extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            if (!ctx.args.targetType) {
                ctx.args.targetType = "global";
            }
            const target = await ctx.getPermissionTarget();
            if (!target) {
                return ctx.sendLocale("generic.target-not-found", { target: `$t(keywords.${ctx.args.targetType.toLowerCase()})` });
            }
            const args = {targetType: ctx.args.targetType.toLowerCase(), target};
            return getPermissions();

            async function getPermissions() {
                let specialTargetCases = {
                    global: "global",
                    category: "categories"
                };
                let targetPerms = ctx.guildEntry.props.permissions[specialTargetCases[args.targetType] || `${args.targetType}s`];
                if (Array.isArray(targetPerms)) {
                    targetPerms = targetPerms.find(perms => perms.id === args.target.id);
                }
                if (!targetPerms) {
                    return ctx.sendLocale("removepermission.notset", { targetType: args.targetType === "global" ? "$t(keywords.server)" : `$t(keywords.${args.targetType})`, target: `**${(args.target.name || args.target.tag)}**`});
                }
                const embed = formatPermissions(targetPerms);
                const withinLimits = embed.fields[0].value.length < 1024 && embed.fields[1].value.length < 1024;
                return ctx.msg.channel.createMessage(withinLimits ? {embed} : "", !withinLimits ? formatToFile(embed, args) : null);
            }
        
            function formatPermissions(targetPerms) {
                return {
                    color: process.env.EMBED_COLOR,
                    fields: (() => {
                        if (args.targetType === "global") {
                            targetPerms.allowedCommands = targetPerms.allowedCommands.concat(ctx.client.models.defaultPermissions.allowedCommands.map(perm => `${perm} (${ctx.returnLocale("keywords.default")})`));
                            targetPerms.restrictedCommands = targetPerms.restrictedCommands.concat(ctx.client.models.defaultPermissions.restrictedCommands.map(perm => `${perm} (${ctx.returnLocale("keywords.default")})`));
                        }
                        return [{
                            name: ctx.returnLocale("generic.allowed-perms"),
                            value: targetPerms.allowedCommands[0] ? "```diff\n" + targetPerms.allowedCommands.map(perm => `+ ${perm}`).join("\n") + "```" : ctx.returnLocale("generic.none-set")
                        }, {
                            name: ctx.returnLocale("generic.disallowed-perms"),
                            value: targetPerms.restrictedCommands[0] ? "```diff\n" + targetPerms.restrictedCommands.map(perm => `- ${perm}`).join("\n") + "```" : ctx.returnLocale("generic.none-set")
                        }];
                    })()
                };
            }
        
            function formatToFile(embed, args) {
                let content = `${ctx.returnLocale("generic.allowed-perms")}:\n`;
                content += embed.fields[0].value.replace(/\`\`\`diff/g, "").replace(/\+/g, "").replace(/\`\`\`/g, "");
                content += `${ctx.returnLocale("generic.disallowed-perms")}:\n`;
                content += embed.fields[1].value.replace(/\`\`\`diff/g, "").replace(/\-/g, "").replace(/\`\`\`/g, "");
                return { 
                    file: Buffer.from(content),
                    name: `${args.targetType === "global" ? "Global" : ""} Permissions ${args.targetType !== "global" ? ("for the " + args.targetType + " " + (args.target.name || args.target.username)) : ""}.txt`
                };
            }
        });
        this.setName("getpermissions")
            .setAliases(["getperms", "gp"])
            .setDescription("Get the permissions for the given target")
            .setExpectedArgs("targetType:(global|category|channel|role|user)* target:string*");
    }
};