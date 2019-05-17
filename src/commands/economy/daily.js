const Command = require("../../structures/Command");

module.exports = class Daily extends Command {
  constructor(client) {
    super(client, async (ctx) => {
      if (ctx.userEntry.isInCooldown('dailyCooldown')) {
        return `Ahhh, I am very sorry but you still have to wait \`${ctx.client.utils.toElapsedTime(ctx.userEntry.props.cooldowns.dailyCooldown - Date.now(), true)}\` before using daily again`
      }
      ctx.userEntry.addCoins(Number(process.env.DAILY_COINS)).addCooldown("dailyCooldown", Number(process.env.DAILY_COOLDOWN)).save();
      return `Hai ! You received \`${process.env.DAILY_COINS}\` holy coins, you now have \`${ctx.userEntry.props.economy.coins}\` holy coins`
    });
    this.setName("daily")
      .setDescription("Get your daily holy coins")
  }
};
