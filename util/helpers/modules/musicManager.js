'use strict';

const MusicConnection = require('./musicConnection');

/**
 * @typedef {import("eris").Guild} Guild
 * @typedef {import("eris").EmbedBase} Embed
 * @typedef {import("../../../main.js")} Client
 */



/**
 * @prop {object} client - The client given in the constructor
 * @prop {array} nodes - An array of nodes
 * @prop {object} regions - A list of locations to use for specific regions 
 */
class MusicManager {
    /**
     * Create a new MusicManager instance; This does not trigger the connection to the Lavalink server, MusicManager.init() serve that purpose
     * @param {Client} client - The client instance
     * @param {object} [options] - An additional object of options
     * @param {boolean} [options.reload] - Whether this is a reload or not, effectively deciding if voice connections should be reset
     */
    constructor(client, options = {}) {
        this.client = client;
        this.nodes = [];
        this.baseURL = (node) => `http://${node.host}:${client.config.options.music.nodes.find(n => n.host === node.host).port}`;
        this.axios = require('axios').default.create({});
        this.axios.defaults.headers.common['Accept'] = 'application/json';
        // @ts-ignore
        this.connections = new(require('../../modules/collection'))();
        this.regions = {
            eu: ['eu', 'amsterdam', 'frankfurt', 'russia', 'hongkong', 'singapore', 'sydney'],
            us: ['us', 'brazil'],
        };
        if (options.reload) {
            this.init(options);
        }
    }

    init(options = {}) {
        const { PlayerManager } = require('eris-lavalink');
        if (!(this.client.bot.voiceConnections instanceof PlayerManager) || options.reload) {
            this.client.bot.voiceConnections = new PlayerManager(this.client.bot, this.nodes, {
                numShards: this.client.bot.shards.size, // number of shards
                userId: this.client.bot.user.id, // the user id of the bot
                regions: this.regions,
                defaultRegion: 'eu'
            });
        }
        this._connectToNodes();
    }

    /**
     * Resolve a list of tracks from the given query
     * @param {object} node - The node 
     * @param {string} query - The query
     * @returns {Promise<array>} An array of resolved tracks
     */
    async resolveTracks(node, query) {
        query = this._parseQuery(query);
        const result = await this.axios.get(`${this.baseURL(node)}/loadtracks?identifier=${query}`, {headers: {'Authorization': node.password}})
            .catch(err => {
                this.client.bot.emit('error', err);
                return false;
            });
        // @ts-ignore
        return result ? result.data : undefined; // array of tracks resolved from lavalink
    }

    /**
     * Get or create a music player for the specified channel
     * @param {object|string} channel - The Eris channel object (must be a guild voice channel) or its ID
     * @returns {Promise<MusicConnection>} A MusicConnection instance
     */
    async getPlayer(channel) {
        if (typeof channel === "string") {
            channel = this.client.bot.guilds.get(this.client.bot.channelGuildMap[channel]).channels.get(channel);
        }
        let player = this.connections.get(channel.guild.id);
        let options = {};
        if (channel.guild.region) {
            options.region = channel.guild.region;
        }
        if (!player) {
            player = await this.client.bot.joinVoiceChannel(channel.id, options).then(p => new MusicConnection(this.client, p));
            this.connections.set(channel.guild.id, player);
            player.on("inactive", this.connections.delete.bind(this.connections, channel.guild.id));
        }
        return player;
    }
    
    /**
     * Parse a song duration and make it human-readable
     * @param {object|number} track - The track object or the duration of the song in milliseconds
     * @returns {string} The human-readable duration of the video
     */
    parseDuration(track) {
        const ms = track.info ? false : track;
        if ((!ms && ms !== 0) && track.info.isStream) {
            return 'Unknown (Live stream)';
        }
        let hours = `${Math.floor(((ms === 0 ? 0 : ms || track.info.length)) / 1000 / 60 / 60)}`;
        let minutes = `${Math.floor(((ms === 0 ? 0 : ms || track.info.length) / 1000) / 60 - (60 * parseInt(hours) ))}`;
        let seconds = `${Math.floor(((ms === 0 ? 0 : ms || track.info.length)) / 1000) - (60 * (Math.floor(((ms === 0 ? 0 : ms || track.info.length) / 1000) / 60)))}`;
        if (hours === '0') {
            hours = '';
        }
        if (hours.length === 1) {
            hours = '0' + hours;
        }
        if (minutes === '0') {
            minutes = '00';
        }
        if (minutes.length === 1) {
            minutes = '0' + minutes;
        }
        if (seconds === '0') {
            seconds = '00';
        }
        if (seconds.length === 1) {
            seconds = '0' + seconds;
        }
        return `${hours ? (hours + ':') : hours}${minutes}:${seconds}`;
    }

    /**
     * @private
     * @param {string} query - The query to parse
     * @returns {string} The encoded query formatted according to the pattern identified 
     */
    _parseQuery(query) {
        const args = query.split(/\s+/g);
        const url = new RegExp(/https:\/\//);
        if (args.length === 1) {
            if (url.test(args[0])) {
                query = query.replace(/<|>/g, '');
            } else {
                query = `ytsearch:${query}`;
            }
        } else {
            if (url.test(query)) {
                for (const arg of args) {
                    if (url.test(arg)) {
                        return query = arg;
                    }
                }
            } 
            query = args[0].toLowerCase() === 'soundcloud' ? `scsearch:${query}` : `ytsearch:${query}`;
        }
        return encodeURIComponent(query);
    }

    /**
     * Get the queue of a guild, note that this should only be used if you don't have access to the MusicConnection instance of the guild, as this method only fetch from redis
     * @param {string | Guild} guild - The guild ID or object to get the queue from
     * @returns {Promise<array>} The queue, or an empty array if none has been retrieved from redis
     */
    async getQueueOf(guild) {
        if (!this.client.redis || !this.client.redis.healthy) {
            return [];
        }
        //@ts-ignore
        return this.client.redis.get(`${guild.id ? guild.id : guild}-queue`)
            .then(q => q ? JSON.parse(q) : [])
            .catch(err => {
                this.client.bot.emit("error", err);
                return [];
            });
    }

    async genericEmbed(track, connection, title) {
        let fields = [
            {
            name: 'Author',
            value: track.info.author,
            inline: true
        }, {
            name: 'Duration',
            value: (connection.nowPlaying.track === track.track ? `${this.parseDuration(connection.player.state.position || 0)}/` : '') + this.parseDuration(track),
            inline: true
        }];
        if (track.info.requestedBy) {
            let user = await this.client.fetchUser(track.info.requestedBy);
            // @ts-ignore
            fields.push({
                name: 'Requested by',
                value: user.tag
            });
        }
        return {
            title: `:musical_note: ${title}`,
            description: `[${track.info.title}](${track.info.uri})`,
            fields: fields,
            color: this.client.config.options.embedColor
        };
    }

    /**
     * Destroy the WS connection with Lavalink
     * @returns {void | Boolean} return false or destroy connection
     */
    disconnect() {
        if (!this.client.bot.voiceConnections.nodes) {
            return false;
        }
        this.client.bot.voiceConnections.nodes.forEach(node => node.destroy());
    }

    _reload() {
        this.disconnect();
        delete require.cache[module.filename];
        delete require.cache[require.resolve('./musicConnection')];
        return new(require(module.filename))(this.client, {reload: true});
    }

    _connectToNodes() {
        for (const node of this.client.config.options.music.nodes) {
            this.client.bot.voiceConnections.createNode({
                host: node.host,
                port: node.WSPort,
                password: node.password,
                region: node.region,
                numShards: this.client.bot.shards.size,
                userId: this.client.bot.user.id
            });
            this.client.bot.voiceConnections.nodes.get(node.host).on('ready', this._onNodeConnection.bind(this, node));
        }
    }

    _onNodeConnection(node) {
        process.send({name: 'info', msg: `Successfully established the WebSocket connection with the Lavalink node at ${node.host}:${node.port}. Covered region for this node is set to ${node.region}`});
    }
}

module.exports = MusicManager;