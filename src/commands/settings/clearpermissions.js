const Command = require("../../structures/Command");

module.exports = class ClearPermissions extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            await ctx.sendLocale("generic.confirm-action");
            const confirmation = await ctx.client.messageCollector.awaitMessage(ctx.msg.channel.id, ctx.msg.author.id);
            if (!confirmation || confirmation.content.toLowerCase().trim() !== "yes") {
                return ctx.sendLocale("generic.command-aborted");
            }
            await ctx.guildEntry.clearPermissions().save();
            return ctx.sendLocale("clearpermissions.success");
        });
        this.setName("clearpermissions")
            .setAliases(["clearperms", "nukeperms", "cp"])
            .setDescription("Clear all the permissions set on this server")
            .setGuildOwnerOnly(true);
    }
};