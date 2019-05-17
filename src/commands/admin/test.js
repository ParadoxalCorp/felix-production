const Command = require("../../structures/Command");

module.exports = class Test extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            if (ctx.args.balance) {
                throw new Error("test");
                return `You have ${ctx.userEntry.props.economy.coins} coins`;
            } else {
                await ctx.userEntry.addCoins(250).save();
                return `You now have ${ctx.userEntry.props.economy.coins} coins`;
            }
        });
        this.setName("test")
            .setDescription("Baguette tbh")
            .setExpectedArgs("balance:text*")
            .setOwnerOnly(true);
    }
};