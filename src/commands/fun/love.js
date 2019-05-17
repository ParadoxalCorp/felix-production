const Command = require("../../structures/Command");
/** @typedef {import("../../structures/Command").Context} context */

module.exports = class RegisterDonator extends Command {
  constructor(client) {
    super(client, async (ctx) => {
      let lp = Number(ctx.client.utils.isWholeNumber(ctx.args.count) || 1)
      const remainingLps = this.getRemainingLps(ctx);
      if (!ctx.args.count) {
        if (!remainingLps) {
          const remainingTime = ctx.client.utils.toElapsedTime(ctx.userEntry.getNearestCooldown('loveCooldown') - Date.now());
          // @ts-ignore
          return `:x: You already used all your love points, time remaining: ${remainingTime.days}d ${remainingTime.hours}h ${remainingTime.minutes}m ${remainingTime.seconds}s`
        }
        return `You have \`${remainingLps}\` love point(s) available`
      } else if (ctx.userEntry.isInCooldown('loveCooldown')) {
        const remainingTime = ctx.client.utils.toElapsedTime(ctx.userEntry.getNearestCooldown('loveCooldown') - Date.now());
        // @ts-ignore
        return `:x: You already used all your love points, time remaining: ${remainingTime.days}d ${remainingTime.hours}h ${remainingTime.minutes}m ${remainingTime.seconds}s`
      }
      const targetUser = await ctx.fetchUser(ctx.args.target)
      if (!targetUser) {
        return `:x: I couldn't find the user you specified :v`
      } else if (targetUser.id === ctx.msg.author.id) {
        return `:x: Trying to love yourself eh? :eyes:`
      }
      if (remainingLps < lp) {
        lp = remainingLps;
      }
      const targetEntry = await ctx.client.db.getUser(targetUser.id);
      targetEntry.addLovePoints(lp).save()
      // for (let i = 0; i < lp; i++) {
      //   ctx.userEntry.addCooldown('loveCooldown', Number(process.env.LOVE_COOLDOWN)).save();
      // }
      return `:heart: Haii ! You just gave **${lp}** love point to **${targetUser.username}**`
    })
    this.setName("love")
      .setAliases(["luv"])
      .setDescription("Love someone, bring some love to this world !")
      .setExpectedArgs("count:number* target:(user_resolvable)*")
  }

  /**
   * 
   * 
   * @param {context} ctx 
   * @returns 
   */
  getRemainingLps(ctx) {
    const cooldownObj = ctx.userEntry.props.cooldowns.loveCooldown;
    let remainingLps = cooldownObj.max - cooldownObj.cooldowns.length; //In case the user is new and hasn't received the max cooldowns yet
    for (const cooldown of cooldownObj.cooldowns) {
      if (cooldown < Date.now()) {
        remainingLps++;
      }
    }
    return remainingLps;
  }
};





