const Command = require('../../structures/Command');

module.exports = class Test extends Command {
    constructor(client) {
        super(client, async(ctx) => {
            if (ctx.args.balance) {
                // console.log(require('util').inspect(ctx));
                console.log(ctx.args);
                return `You have ${ctx.userEntry.props.coins} coins`;
            } else {
                await ctx.userEntry.addCoins(250).save();
                return `You now have ${ctx.userEntry.props.coins} coins`;
            }
        });
        this.setName('test')
            .setDescription('Baguette tbh')
            .setExpectedArgs('balance:text*')
    }
};