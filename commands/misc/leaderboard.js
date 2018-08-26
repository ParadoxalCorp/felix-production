const FunCommands = require('../../structures/CommandCategories/MiscCommands');
const databaseUpdater = require('../../utils/databaseUpdater');

class Leaderboard extends FunCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'leaderboard',
                description: 'Get the leaderboard of the most loved, richest and active users. Here\'s an example of how to use the command: `{prefix}leaderboard love`, this will show the global love points leaderboard.\n\nAs for the experience, you can check this\'s server local leaderboard like `{prefix}leaderboard experience local`',
                usage: '{prefix}leaderboard <love|coins|experience> | <global|local?>',
            },
            conf: {
                aliases: ["lb"],
                expectedArgs: [{
                    description: 'Please choose what leaderboard to show, can be either `love`, `coins` or `experience`',
                    possibleValues: [{
                        name: 'love',
                        interpretAs: '{value}'
                    }, {
                        name: 'coins',
                        interpretAs: '{value}'
                    }, {
                        name: 'experience',
                        interpretAs: '{value}'
                    }]
                }, {
                    description: 'Please specify whether the leaderboard to show is the global or the local (this server) one, can be either `global` or `local`',
                    condition: (client, message, args) => args[0].toLowerCase() === 'experience',
                    possibleValues: [{
                        name: 'global'
                    }, {
                        name: 'local'
                    }]
                }]
            }
        });
    }
    /** @param {import("../../structures/Contexts/MiscContext")} context */

    async run(context) {
        if (!['love', 'coins', 'experience'].includes(context.args[0].toLowerCase())) {
            return context.message.channel.createMessage(':x: You didn\'t specified what leaderboard I had to show, please specify either `love`, `coins` or `experience`');
        }
        const leaderboard = context.args[0].toLowerCase();
        context.global = context.args[1] && context.args[1].toLowerCase() === 'local' ? false : true;
        context.rethink = context.client.handlers.DatabaseWrapper.rethink;
        if (leaderboard === 'love') {
            return this.getLoveLeaderboard(context);
        } else if (leaderboard === 'coins') {
            return this.getCoinsLeaderboard(context);
        } else if (leaderboard === 'experience') {
            return this.getExperienceLeaderboard(context);
        }
    }

    
    async getLoveLeaderboard(context) {
        let leaderboard = await context.rethink.table("users").orderBy(context.rethink.desc(context.rethink.row("love")("amount"))).then(l => l.map(u => databaseUpdater(u, 'user')));
        if (!leaderboard.length) {
            return context.message.channel.createMessage(':x: Seems like there is nobody to show on the leaderboard yet');
        }
        const users = await this.fetchUsers(leaderboard);
        return context.message.channel.createMessage({
            embed: {
                title: 'Global love leaderboard',
                color: context.client.config.options.embedColor.generic,
                description: leaderboard.slice(0, 10).map(u => `#${this.getPosition(u.id, leaderboard)} - **${users.get(u.id).tag}**\nLove points: ${u.love.amount}`).join("\n\n"),
                footer: {
                    text: `Your position: #${leaderboard.findIndex(element => element.id === context.message.author.id) + 1}/${leaderboard.length}`
                },
                thumbnail: {
                    url: context.client.bot.user.avatarURL
                }
            }
        });
    }

    async getCoinsLeaderboard(context) {    
        let leaderboard = await context.rethink.table("users").orderBy(context.rethink.desc(context.rethink.row("economy")("coins"))).then(l => l.map(u => databaseUpdater(u, 'user')));
        if (!leaderboard.length) {
            return context.message.channel.createMessage(':x: Seems like there is nobody to show on the leaderboard yet');
        }
        const users = await this.fetchUsers(leaderboard);
        return context.message.channel.createMessage({
            embed: {
                title: 'Global coins leaderboard',
                color: context.client.config.options.embedColor.generic,
                description: leaderboard.slice(0, 10).map(u => `#${this.getPosition(u.id, leaderboard)} - **${users.get(u.id).tag}**\nCoins: ${u.economy.coins}`).join("\n\n"),
                footer: {
                    text: `Your position: #${leaderboard.findIndex(element => element.id === context.message.author.id) + 1}/${leaderboard.length}`
                },
                thumbnail: {
                    url: context.client.bot.user.avatarURL
                }
            }
        });
    }

    async getExperienceLeaderboard(context) {
        let leaderboard = context.guildEntry.experience.members;
        if (context.global) {
            leaderboard = await context.rethink.table("users").orderBy(context.rethink.desc(context.rethink.row("experience")("amount"))).run({arrayLimit: 2e5}).then(l => {
                return l.map(u => {
                    u = databaseUpdater(u, 'user');
                    u.levelDetails = context.client.handlers.ExperienceHandler.getLevelDetails(new context.client.structures.ExtendedUserEntry(u, context.client).getLevel());
                    return u;
                });
            });
        } else {
            leaderboard = leaderboard.sort((a, b) => b.experience - a.experience).map(m => {
                m.levelDetails = context.client.handlers.ExperienceHandler.getLevelDetails(context.guildEntry.getLevelOf(m.id));
                return m;
            });
        }
        if (!leaderboard.length) {
            return context.message.channel.createMessage(':x: Seems like there is nobody to show on the leaderboard yet');
        }
        const users = await this.fetchUsers(leaderboard);
        return context.message.channel.createMessage({
            embed: {
                title: `${context.global ? 'Global' : 'Local'} experience leaderboard`,
                color: context.client.config.options.embedColor.generic,
                description: leaderboard.slice(0, 10).map(u => `#${this.getPosition(u.id, leaderboard)} - **${users.get(u.id).tag}**\nLevel: ${u.levelDetails.level} | ${context.global ? 'Global' : 'Local'} experience: ${context.global ? u.experience.amount : u.experience}`).join("\n\n"),
                footer: leaderboard.find(u => u.id === context.message.author.id) ? {
                    text: `Your position: #${leaderboard.findIndex(element => element.id === context.message.author.id) + 1}/${leaderboard.length}`
                } : undefined,
                thumbnail: {
                    url: context.global ? context.client.bot.user.avatarURL : context.message.channel.guild.iconURL
                }
            }
        });
    }

    async fetchUsers(leaderboard) {
        let resolvedUsers = new this.client.Collection();
        await Promise.all([...leaderboard].slice(0, 10).map(u => this.client.utils.helpers.fetchUser(u.id)))
            .then(fetchedUsers => {
                let i = 0;
                for (let user of fetchedUsers) {
                    if (!user) {
                        user = {
                            tag: 'Unknown User'
                        };
                    }
                    if (!user.tag) {
                        user.tag = `${user.username}#${user.discriminator}`;
                    }
                    resolvedUsers.set(leaderboard[i].id, user);
                    i++;
                }
            });
        return resolvedUsers;
    }

    getPosition(id, target) {
        let userPosition = target.findIndex(u => u.id === id);
        if (userPosition === 0) {
            return ":trophy:";
        }
        else if (userPosition === 1) {
            return ":second_place:";
        }
        else if (userPosition === 2) {
            return ":third_place:";
        } else {
            return userPosition + 1;
        }
    }
}

module.exports = Leaderboard;