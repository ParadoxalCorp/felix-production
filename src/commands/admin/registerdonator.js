const Command = require("../../structures/Command");

module.exports = class RegisterDonator extends Command {
  constructor(client) {
    super(client, async (ctx) => {
      if (!ctx.args.tier) {
        return `:x: Missing ctx.args`
      }
      if (!ctx.client.utils.isWholeNumber(ctx.args.tier)) {
        return 'The specified tier is not a whole number :angery:'
      }
      
      const newDonator = await ctx.client.db.getUser(ctx.args.userID);
      newDonator.props.premium.tier = parseInt(ctx.args.tier);
      newDonator.props.premium.expire = ctx.args.premiumExpiration ? new Date().getTime() + parseInt(ctx.args.premiumExpiration) : 0;
      if (newDonator.props.premium.tier >= 4) {
        newDonator.props.cooldowns.loveCooldown.max = newDonator.props.cooldowns.loveCooldown.max + (newDonator.props.premium.tier - 3);
        if (newDonator.props.premium.tier = 4) {
          newDonator.addCoins(5e7);
        }
        if (newDonator.props.premium.tier >= 5) {
          newDonator.addCoins(1e9);
        }
      }
      await newDonator.save()
      let res = `:white_check_mark: Successfully given premium status to the user \`${ctx.msg.author.username}#${ctx.msg.author.discriminator}\` at tier \`${ctx.args.tier}\`\n\n`;
      if (ctx.args.premiumExpiration) {
        res += `The premium status of this user will expire in **${ctx.client.utils.toElapsedTime(ctx.args.premiumExpiration, true)}** the **${ctx.client.utils.toHumanDate(newDonator.props.premium.expire)}**`;
      }
      return res;
    });
    this.setName("registerDonator")
      .setAliases(['registerdonor', 'registerpatron', "regpatron", "regdonor"])
      .setDescription("Register a new donator and give them premium status, omit the `<duration_in_milliseconds>` parameter to not set any expiration date")
      .setOwnerOnly(true)
      .setExpectedArgs("tier:number userID:string premiumExpiration:(number)*")
  }
};
