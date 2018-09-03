const ModerationCommands = require("../../structures/CommandCategories/ModerationCommands");

class Clear extends ModerationCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "clear",
                description: "Prune messages, the available filters are `-b`, (deletes only bot messages) `-c` (delete commands and their outputs) and `-u` (delete the specified user messages)\n\nSo for example `{prefix}clear 50 -bcu @Baguette` will clear all the bots messages, the commands and the messages from the user `Baguette` in the last 50 messages",
                usage: "{prefix}clear <count> <filters>"
            },
            conf: {
                requirePerms: ["manageMessages"],
                aliases: [
                    "clean", "prune"
                ],
                guildOnly: true
            }
        });
    }

    /** @param {import("../../structures/Contexts/ModerationContext")} context */

    async run(context) {
        const limit = context.args[0];
        if (!limit || !context.client.utils.isWholeNumber(limit)) {
            return context.message.channel.createMessage(`:x: You didn't specify how many messages to delete`);
        }
        let filtered = [];
        const slice = (collection, count) => {
            const newColl = new this.client.Collection();
            const colEntries = new this.client.Collection(collection).sort((a, b) => b.timestamp - a.timestamp).entries();
            for (let i = 0; i < count; i++) {
                const value = colEntries.next().value;
                newColl.set(value[0], value[1]);
            }
            return newColl;
        };
        //Don't fetch the messages if they're already cached, use the cached messages and take only the specified amount
        let fetchedMessages = context.message.channel.messages.size >= limit
            ? slice(context.message.channel.messages, limit)
            : await context.message.channel.getMessages(parseInt(limit));
        //Filter messages older than 2 weeks
        fetchedMessages = Array.isArray(fetchedMessages)
            ? fetchedMessages.filter(m => m.timestamp > Date.now() - 1209600000)
            : fetchedMessages.filterArray(m => m.timestamp > Date.now() - 1209600000);
        for (const arg of context.args) {
            if (arg.startsWith("-")) {
                if (arg.toLowerCase().includes("b")) {
                    filtered = filtered.concat(fetchedMessages.filter(m => m.author.bot));
                }
                if (arg.toLowerCase().includes("u")) {
                    const user = await context.getUserFromText(context.args.splice(2).join(" "));
                    filtered = filtered.concat(fetchedMessages.filter(m => m.author.id === (
                        user
                            ? user.id
                            : context.message.author.id)));
                }
                if (arg.toLowerCase().includes("c")) {
                    filtered = filtered.concat(fetchedMessages.filter(m => m.author.id === context.client.bot.user.id));
                    filtered = filtered.concat(fetchedMessages.filter(m => m.content.startsWith(
                        context.guildEntry
                            ? context.guildEntry.getPrefix
                            : context.client.config.prefix) || m.content.startsWith(`<@${context.client.bot.user.id}>`) || m.content.startsWith(`<@!${context.client.bot.user.id}`)));
                }
            }
        }
        let uniqueMessages = filtered[0]
            ? []
            : fetchedMessages.map(m => m.id);

        for (const m of filtered) {
            if (!uniqueMessages.find(msg => msg === m.id)) {
                uniqueMessages.push(m.id);
            }
        }
        if (uniqueMessages.length < 2) {
            context.message.channel.createMessage(":x: Not enough messages have been matched with the filter");
        }
        await context.message.channel.deleteMessages(uniqueMessages);
        context.message.channel.createMessage(`:white_check_mark: Deleted **${uniqueMessages.length}** messages`).then(m => {
            setTimeout(() => {
                m.delete().catch(() => {});
            }, 4000);
        });
    }
}

module.exports = Clear;