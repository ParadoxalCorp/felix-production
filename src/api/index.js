/** 
 * @typedef {import('../Cluster')} Client
*/

const Hapi = require('@hapi/hapi');
const _ = require("underscore")

class ApiServer {
    /**
     * @param {Client} client The client instance
     */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
        this._source = "Api";
    }

    /**
     * Connects to the database
     * @returns {Promise<void>} The api instance
     * @memberof ApiServer
     */
    async start() {


        const server = new Hapi.server({
            port: 4000,
            host: 'localhost'
        });

        const _client = this.client

        server.route({
            method: 'GET',
            path: '/',
            handler: function (request, h) {
                return "api"
            }
        })

        server.route({
            method: 'GET',
            path: '/{userID}',
            handler: function (request, h) {
                let mutualGuilds = _client.guilds.filter(g => g.members.has(request.params.userID));
                mutualGuilds = _.map(mutualGuilds, _.clone);
                mutualGuilds.forEach(g => {
                    let guildPos = mutualGuilds.findIndex(guild => guild.id === g.id);
                    mutualGuilds[guildPos].channels = Array.from(mutualGuilds[guildPos].channels.values());
                    mutualGuilds[guildPos].roles = Array.from(mutualGuilds[guildPos].roles.values());
                    mutualGuilds[guildPos].members = Array.from(mutualGuilds[guildPos].members.values());
                    mutualGuilds[guildPos].userPermissions = _client.guilds.get(g.id).members.get(request.params.userID).permission.json;
                    delete mutualGuilds[guildPos].shard
                });
                return mutualGuilds
            }
        })

        await server.start();
        this.client.logger.info({ src: this._source, msg: `Successfully started the api at ${server.info.uri}` });
    }
}

module.exports = ApiServer;