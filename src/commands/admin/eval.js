const Command = require("../../structures/Command");
const { inspect } = require("util");
const { post } = require("axios").default;

module.exports = class Eval extends Command {
    constructor(client) {
        super(client, async (ctx) => {
            let input = ctx.args.input;
            const asynchr = input.includes("return") || input.includes("await");
            let result, evalTime, before;

            ctx.args = { ...ctx.client.utils.parseFlags(ctx.args.input.split(/\s+/)), ...ctx.args };
            const flags = [`--depth=${ctx.args.depth}`];
            for (const flag of flags) {
                input = input.replace(flag, "");
            }
            try {
                before = process.hrtime.bigint();
                result = await eval(asynchr ? `(async()=>{${input}})();` : input) // eslint-disable-line
                evalTime = process.hrtime.bigint() - before;
                if (typeof result !== "string") {
                    result = inspect(result, {
                        depth: ctx.args["depth"] || +!(inspect(result, { depth: 1 }).length > 1990) // Results in either 0 or 1
                    });
                }
                const tokenRegex = new RegExp(process.env.DISCORD_TOKEN, "gi");
                result = result.replace(tokenRegex, "baguette tbh");
            } catch (err) {
                evalTime = process.hrtime.bigint() - before;
                result = err.message;
            }

            if (result.length > 1970) {
                return await post("https://hastepaste.com/api/create", `raw=false&ext=javascript&text=${encodeURIComponent(input + "\n\n" + result)}`, { headers: { "Content-Type": "application/x-www-form-urlencoded" } })
                    .then(res => `Eval exceeds 2000 characters. View here: ${res.data}`)
                    .catch(err => err.response.status);
            }
            await ctx.msg.channel.createMessage("**Input** ```js\n" + ctx.args.input + "```");
            return "**Output** ```js\n" + result + "```\nEval took " + evalTime / BigInt(1000) + "μs";
        });
        this.setName("eval")
            .setDescription("Eval some stuff")
            .setOwnerOnly(true)
            .setExpectedArgs("input:string");
    }
};