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
        const leaderboardData = await this.getLeaderboard(leaderboard, context.message.author);
        if (!leaderboardData.leaderboard[0] && (leaderboard === 'love' || leaderboard === 'coins' || (leaderboard === 'experience' && context.global))) {
            return context.message.channel.createMessage(':x: Seems like there is nobody to show on the leaderboard yet');
        }
        const users = await this.fetchUsers(leaderboardData.leaderboard);
        if (leaderboard === 'love') {
            return this.getLoveLeaderboard(context, leaderboardData, users);
        } else if (leaderboard === 'coins') {
            return this.getCoinsLeaderboard(context, leaderboardData, users);
        } else if (leaderboard === 'experience') {
            return this.getExperienceLeaderboard(context, leaderboardData, users);
        }
    }
    
    async getLoveLeaderboard(context, leaderboardData, users) {
        return context.message.channel.createMessage({
            embed: {
                title: 'Global love leaderboard',
                color: context.client.config.options.embedColor.generic,
                description: leaderboardData.leaderboard.map(u => `#${this.getPosition(u.id, leaderboardData.leaderboard)} - **${users.get(u.id).tag}**\nLove points: ${u.amount}`).join("\n\n"),
                footer: {
                    text: 'Your position: ' + ((leaderboardData.userIndex + 1) ? `#${leaderboardData.userIndex + 1}/${leaderboardData.size}` : 'Not yet ranked')
                },
                thumbnail: {
                    url: context.client.bot.user.avatarURL
                }
            }
        });
    }

    async getCoinsLeaderboard(context, leaderboardData, users) {
        return context.message.channel.createMessage({
            embed: {
                title: 'Global coins leaderboard',
                color: context.client.config.options.embedColor.generic,
                description: leaderboardData.leaderboard.map(u => `#${this.getPosition(u.id, leaderboardData.leaderboard)} - **${users.get(u.id).tag}**\nCoins: ${u.amount}`).join("\n\n"),
                footer: {
                    text: 'Your position: ' + ((leaderboardData.userIndex + 1) ? `#${leaderboardData.userIndex + 1}/${leaderboardData.size}` : 'Not yet ranked')
                },
                thumbnail: {
                    url: context.client.bot.user.avatarURL
                }
            }
        });
    }

    async getExperienceLeaderboard(context, leaderboardData, users) {
        let leaderboard;
        if (context.global) {
            leaderboard = leaderboardData.leaderboard;
        } else {
            leaderboard = context.guildEntry.experience.members.sort((a, b) => b.experience - a.experience);
            if (!leaderboard[0]) {
                return context.message.channel.createMessage(':x: Seems like there is nobody to show on the leaderboard yet');
            }
            users = await this.fetchUsers(leaderboard.slice(0, 10));
        }
        leaderboard = leaderboard.map(m => {
            m.level = context.client.utils.helpers.getLevelFromExperience(m.experience || m.amount);
            return m;
        });
        const globalUserPosition = (leaderboardData.userIndex + 1) ? `#${leaderboardData.userIndex + 1}/${leaderboardData.size}` : 'Not yet ranked';
        const localUserPosition = leaderboard.find(u => u.id === context.message.author.id) ? `#${leaderboard.findIndex(element => element.id === context.message.author.id) + 1}/${leaderboard.length}` : `Not yet ranked/${leaderboard.length}`;
        return context.message.channel.createMessage({
            embed: {
                title: `${context.global ? 'Global' : 'Local'} experience leaderboard`,
                color: context.client.config.options.embedColor.generic,
                description: leaderboard.slice(0, 10).map(u => `#${this.getPosition(u.id, leaderboard)} - **${users.get(u.id).tag}**\nLevel: ${u.level} | ${context.global ? 'Global' : 'Local'} experience: ${context.global ? u.amount : u.experience}`).join("\n\n"),
                footer: {
                    text: context.global ? `Your position: ${globalUserPosition}` : `Your position: ${localUserPosition}`
                },
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