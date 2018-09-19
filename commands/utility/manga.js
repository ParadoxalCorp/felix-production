const UtilityCommands = require("../../structures/CommandCategories/UtilityCommands");

class Manga extends UtilityCommands {
    constructor(client) {
        super(client, {
            help: {
                name: "manga",
                description: "Search for the specified manga through kitsu.io",
                usage: "manga <manga_name>"
            }
        }, { noArgs: ':x: You did not specify a manga to search for' });
    }

    /** @param {import("../../structures/Contexts/UtilityContext")} context */

    async run(context) {
        const res = await context.client.handlers.KitsuWrapper.searchManga(context.args.join(" "));
        if (!res[0]) {
            return context.message.channel.createMessage(":x: Your search did not returned any result");
        }
        let selectedManga = res[0];
        if (res.length > 1) {
            let i = 1;
            const query = await context.message.channel.createMessage({
                embed: {
                    description: "owo, i found multiple animes corresponding to your search, please select one with its number ```\n" + res.map(a => `[${i++}] ${a.titles.en_jp || a.titles.en || a.titles.ja_jp}`).join("\n") + "```",
                    color: context.client.config.options.embedColor.generic
                }
            });
            const reply = await context.client.handlers.MessageCollector.awaitMessage(context.message.channel.id, context.message.author.id);
            if (!reply) {
                query.delete().catch(() => {});
                return context.message.channel.createMessage(":x: Timeout: Command aborted");
            }
            if (!res[reply.content - 1]) {
                query.delete().catch(() => {});
                return context.message.channel.createMessage(":x: You did not enter a whole number or the number you specified is not valid");
            }
            selectedManga = res[reply.content - 1];
            reply.delete().catch(() => {});
            query.delete().catch(() => {});
        }
        return context.message.channel.createMessage({
            embed: {
                color: context.client.config.options.embedColor.generic,
                title: selectedManga.titles.en_jp,
                url: selectedManga.pageLink,
                image: {
                    url: selectedManga.posterImage.large
                },
                fields: [{
                    name: 'Type',
                    value: selectedManga.subtype,
                    inline: true
                }, {
                    name: 'Start date/End date',
                    value: `${selectedManga.startDate}/${selectedManga.endDate}`,
                    inline: true
                }, {
                    name: 'Title',
                    value: `:flag_gb: ${selectedManga.titles.en}\n:flag_jp: ${selectedManga.titles.ja_jp}\n:flag_jp: :flag_gb: ${selectedManga.titles.en_jp}`
                }, {
                    name: 'Status',
                    value: selectedManga.status,
                    inline: true
                }, {
                    name: 'State',
                    value: `Chapters: ${selectedManga.chapterCount}\nVolumes: ${selectedManga.volumeCount || 'Unknown'}`,
                    inline: true
                }, {
                    name: 'Synopsis',
                    value: selectedManga.synopsis.length > 1015 ? selectedManga.synopsis.substr(0, 1015) + "..." : selectedManga.synopsis
                }, {
                    name: 'Age rating',
                    value: selectedManga.ageRating,
                    inline: true
                }, {
                    name: 'Average rating',
                    value: selectedManga.averageRating,
                    inline: true
                }, {
                    name: 'Publisher',
                    value: selectedManga.serialization
                }],
                footer: {
                    text: `Rating rank: ${selectedManga.ratingRank} | Popularity rank: ${selectedManga.popularityRank} | Users: ${selectedManga.userCount} | Favorites: ${selectedManga.favoritesCount}`
                }
            }
        });
    }
}

module.exports = Manga;