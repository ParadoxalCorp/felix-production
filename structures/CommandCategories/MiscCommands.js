/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("eris").User} User
* @typedef {import("../ExtendedStructures/ExtendedUser")} ExtendedUser
* @typedef {import("../Contexts/MiscContext")} MiscContext
*/

/** @typedef {Object} TopUserData 
 * @prop {String} id The ID of the user
 * @prop {Number} amount The amount of love/experience/coins of the user
 */

/** @typedef {Object} LeaderboardData
 * @prop {Array<TopUserData>} leaderboard The 10 first in the leaderboard, ordered from highest to lowest. May be empty if Redis is unavailable/leaderboard isn't yet populated
 * @prop {Number} userIndex The given user's position in this leaderboard
 * @prop {Number} size The amount of entries in the leaderboard
 */

const Command = require('../Command');

class MiscCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string}} [options]  - `noArgs` specify a message to return if no arguments are provided.
     *  These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Misc',
            conf: {
                guildOnly: true,
                requireDB: true
            },
            emote: 'bookmark'
        }});
        this.options = options;
    }

    /**
     * 
     * @param {MiscContext} context - The context
     * @returns {Promise<Object>} An object representing whether the check passed
     */
    async categoryCheck(context) {
        let callback;
        if (['iam', 'iamnot'].includes(this.help.name)) {
            context.guildEntry.selfAssignableRoles = context.guildEntry.selfAssignableRoles.filter(r => context.message.channel.guild.roles.has(r.id)); //Filter deleted roles
            if (!context.args[0]) {
                callback = this.createList;
            } else {
                const guildRole = await context.getRoleFromText(context.args.join(' '));
                if (!guildRole || !context.guildEntry.selfAssignableRoles.find(r => r.id === guildRole.id)) {
                    return context.message.channel.createMessage(":x: The specified role does not exist or it is not a self-assignable role");
                }
                context.guildRole = guildRole;
                callback = this.assignRole || this.removeRole;
            }
        }
        return { passed: true, callback };
    }

    /**
     * 
     * @param {String} leaderboard - The leaderboard to get, can be either `experience`, `coins` or `love`
     * @param {User | ExtendedUser} user - A user from who to get the position, may be -1 if the user isn't in the leaderboard
     * @returns {Promise<LeaderboardData>} The leaderboard data
     */
    async getLeaderboard(leaderboard, user) {
        if (!this.client.handlers.RedisManager.healthy) {
            return {
                leaderboard: [],
                userIndex: -1
            };
        }
        const pipeline = this.client.handlers.RedisManager.pipeline();
        pipeline.zrevrange(`${leaderboard}-leaderboard`, 0, 9, 'WITHSCORES');
        pipeline.zrevrank(`${leaderboard}-leaderboard`, user.id);
        pipeline.zcount(`${leaderboard}-leaderboard`, '-inf', '+inf');
        return pipeline.exec().then(results => {
            return {
                leaderboard: this.client.utils.paginate(results[0][1], 2).map(entry => {
                    return {
                        id: entry[0],
                        amount: entry[1],
                    };
                }),
                userIndex: results[1][1] || (results[1][1] === 0) ? results[1][1] : -1,
                size: results[2][1]
            };
        });
    }
    
    /**
     * Create an interactive list of self-assignable roles
     * @param {MiscContext} context - The context
     * @returns {Promise<void>} A message or interactive list promise
     */
    createList(context) {
        if (!context.guildEntry.selfAssignableRoles[0]) {
            return context.message.channel.createMessage(":x: There is no self-assignable role set on this server");
        }
        return context.client.handlers.InteractiveList.createPaginatedMessage({
            channel: context.message.channel,
            userID: context.message.author.id,
            messages: (() => {
                let messages = [];
                for (const role of context.guildEntry.selfAssignableRoles) {
                    const guildRole = context.message.channel.guild.roles.get(role.id);
                    messages.push({
                        embed: {
                            title: "Self-assignable roles list",
                            description: "Here's the list of the self-assignable roles, you can assign one to yourself with `" + context.prefix + "iam <role_name>`\n",
                            footer: {
                                text: `Showing page {index}/${context.guildEntry.selfAssignableRoles.length} | Time limit: 60 seconds`
                            },
                            fields: [{
                                name: 'Name',
                                value: `${guildRole.name}`,
                                inline: true
                            }, {
                                name: 'HEX Color',
                                value: `#${this.getHexColor(guildRole.color)} (the borders color of this list are a preview)`,
                                inline: true
                            }, {
                                name: `Hoisted`,
                                value: guildRole.hoist ? `:white_check_mark:` : `:x:`
                            }, {
                                name: 'Mentionable',
                                value: guildRole.mentionable ? `:white_check_mark:` : `:x:`,
                                inline: true
                            }, {
                                name: 'Incompatible roles',
                                value: role.incompatibleRoles[0] ? 'This role cannot be stacked with: ' + context.client.commands.get('uinfo').sliceRoles(role.incompatibleRoles.filter(r => context.message.channel.guild.roles.has(r)).map(r => `<@&${r}>`)) : 'This role can be stacked with all other roles'
                            }],
                            color: guildRole.color
                        }
                    });
                }
                return messages;
            })()
        });
    }
}

module.exports = MiscCommands;