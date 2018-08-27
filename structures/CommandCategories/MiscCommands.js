/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("eris").User} User
* @typedef {import("../ExtendedStructures/ExtendedUser")} ExtendedUser
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
                userIndex: results[1][1] || -1,
                size: results[2][1]
            };
        });
    }
}

module.exports = MiscCommands;