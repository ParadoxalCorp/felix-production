'use strict';

/** 
 * @typedef {import("../../main.js").Client} Client
 * @typedef {import("eris-lavalink").Player} ErisLavalinkPlayer
 * @typedef {import("eventemitter3")} EventEmitter3
 */

/**
 * @typedef {Object} LavalinkTrackInfo
 * @property {String} identifier The unique identifier of the track, as defined by the provider (youtube, soundcloud..)
 * @property {Boolean} isSeekable Whether the use of the seek method is possible
 * @property {String} author The name of the author of the track
 * @property {Number} length The duration of the track in milliseconds
 * @property {Boolean} isStream Whether the track is a live-stream
 * @property {Number} position The current position of the player in the track, represented in milliseconds
 * @property {String} title The title of the track
 * @property {String} uri The URL to the track 
 */

 /**
 * @typedef {Object} PartialLavalinkTrackInfo
 * @property {String} identifier The unique identifier of the track, as defined by the provider (youtube, soundcloud..)
 * @property {String} author The name of the author of the track
 * @property {Number} length The duration of the track in milliseconds
 * @property {String} title The title of the track
 * @property {String} uri The URL to the track 
 */

 /**
 * @typedef {Object} LavalinkTrack  
 * @property {String} track The encoded title of the track
 * @property {LavalinkTrackInfo} info An object of info about the track
 */

/**
 * @typedef {Object} PartialLavalinkTrack  
 * @property {String} track The encoded title + uri of the track
 * @property {PartialLavalinkTrackInfo} info An object of info about the track
 */

 /** @typedef {Object} ExtendedTrackInfo
  * @prop {String} requestedBy The ID of the user who requested this track
  * @prop {String} _id The generated ID for this track, for internal purposes
  */

/**
 * @typedef {Object} ExtendedTrack  
 * @property {String} voteID If any, the ID of the ongoing vote targeting this track
 * @property {ExtendedTrackInfo} info Info about the track
 */

 /**
 * @typedef {LavalinkTrack & ExtendedTrack} FelixTrack  
 */

 /**
 * @typedef {Object} AddedTrack  
 * @property {Number} position The position of the track in the queue
 * @property {Number} timeUntilPlaying Estimated time in milliseconds before the track will be played
 */

const EventEmitter = require('eventemitter3');

/**
 * Provides methods to easily manage the queue and the ongoing vote if any, as well as synchronize the queue with redis and handle events in the background
 * @extends EventEmitter
 * @class MusicConnection
 */
class MusicConnection extends EventEmitter {
    /**
     * Create a new MusicConnection instance, this can only be done with an active player
     * @param {Client} client - The client instance
     * @param {ErisLavalinkPlayer} player - The eris-lavalink player 
     */
    constructor(client, player) {
        super();
        /** @type {Client} The client instance */
        this.client = client;
        /** @type {ErisLavalinkPlayer} The eris-lavalink player */
        this.player = player;
        /** @type {String} The repeat mode, can be "off", "song" or "queue" */
        this.repeat = "off";
        /** @type {FelixTrack} The currently playing track, or null if none is playing */
        this.nowPlaying;
        /** @type {Array<FelixTrack>} An array of tracks representing the queue */
        this.queue = [];
        this.inactivityTimeout;
        this.inactiveSince;
        this.skipVote = this.resetVote();
        this.defer = new Promise(resolve => this._init(resolve));
        player.on('disconnect', this._handleDisconnection.bind(this));
        player.on('error', this._handleError.bind(this));
        player.on('stuck', this._handleStuck.bind(this));
        player.on('end', this._handleEnd.bind(this));
    }

    /**
     * Called in the constructor, this method gets the queue from redis
     * @param {function} resolve - The resolver of this.defer
     * @memberof MusicConnection
     * @protected
     * @returns {Promise<void>} Nothing worth it
     */
    async _init(resolve) {
        if (this.client.handlers.RedisManager && this.client.handlers.RedisManager.healthy) {
            await this.client.handlers.RedisManager.get(`${this.player.guildId}-queue`)
                .then(q => {
                    this.queue = q ? JSON.parse(q) : [];
                })
                .catch(err => {
                    this.client.bot.emit('error', err);
                });
            resolve();
        }
    }

    /**
     * Add a track to the queue
     * @param {LavalinkTrack} track - The track object returned by Lavalink 
     * @param {String} requestedBy - The ID of the user who requested this track
     * @param {Boolean} [unshift=false] - Whether the track should be pushed at the start of the queue or not, default to false
     * @returns {AddedTrack} An object containing the position at which the song has been queued and the estimated time in ms before it will be played 
     */
    addTrack(track, requestedBy, unshift = false) {
        this.queue[unshift ? "unshift" : "push"]({
            info: {
                ...track.info,
                requestedBy,
                _id: this._generateID()
            },
            track: track.track
        });
        let position = unshift ? 0 : this.queue.length - 1;
        this._saveQueue();

        return {
            position,
            timeUntilPlaying: (() => {
                let total = 0;
                if (this.nowPlaying) {
                    total += this.nowPlaying.info.length - this.player.state.position;
                }
                for (let i = 0; i < position; i++) {
                    total += this.queue[i].info.length;
                }
                return total;
            })()
        };
    }

    /**
     * Add multiple tracks to the queue
     * @param {Array<LavalinkTrack>} tracks - An array of Lavalink tracks to add to the queue
     * @param {String} [requestedBy] - The ID of the user who requested these tracks, can be omitted if already specified
     * @param {Boolean} [unshift=false] - Whether to add these tracks at the beginning of the queue or at the end, defaults to false
     * @returns {Number} The new length of the queue
     */
    addTracks(tracks, requestedBy, unshift = false) {
        tracks = tracks.map(t => {
            if (requestedBy) {
                t.info.requestedBy = requestedBy;
            }
            t.info._id = this._generateID();
            return t;
        });
        this.queue = unshift ? tracks.concat(this.queue) : this.queue.concat(tracks);
        this._saveQueue();
        return this.queue.length;
    }

    /**
     * Remove the track in the queue at the given position
     * @param {number} position - The position in the queue of the track to remove
     * @returns {FelixTrack} The removed track
     */
    removeTrack(position) {
        const removedTrack = this.queue.splice(position, 1)[0];
        if (this.skipVote.count && removedTrack.voteID === this.skipVote.id) {
            this.skipVote.callback('deleted');
            this.resetVote();
        }
        this._saveQueue();
        return removedTrack;
    }
    /**
     * A direct way to modify the queue while still sending the updated queue to Redis
     * @param {array} newQueue - The new queue to replace the old one with
     * @returns {number} The new length of the queue
     */
    editQueue(newQueue) {
        this.queue = newQueue;
        this._saveQueue();
        return this.queue.length;
    }

    /**
     * Skip the currently playing track and start the next one
     * @param {number} [to=0] - The position in the queue at which to jump to
     * @returns {FelixTrack} The skipped track
     */
    skipTrack(to = 0) {
        const skippedSong = { ...this.nowPlaying };
        if (this.queue[0]) {
            this.play(this.queue[to]);
            if (this.skipVote.count) {
                if (!this.skipVote.id) {
                    this.skipVote.callback('ended');
                }
                this.resetVote();
            }
            if (this.repeat === 'queue') {
                this.queue = this.queue.concat(this.queue.splice(0, to + 1));
            } else {
                this.queue.splice(0, to + 1);
            }
            this._saveQueue();
        } else {
            this.player.stop();
            this.nowPlaying = null;
            this.startInactivityTimeout();
        }
        return skippedSong;
    }

    /**
     * Play a given song
     * @param {LavalinkTrack} song - The Lavalink track to play 
     * @param {String} [requestedBy] - The ID of the user who requested this track
     * @param {object} [options] - An object of options to pass to Lavalink
     * @returns {FelixTrack} The given song
     */
    play(song, requestedBy, options) {
        if (this.inactiveSince) {
            this.inactiveSince = null;
        }
        this.player.play(song.track, options);
        this.nowPlaying = {
            info: {
                ...song.info,
                requestedBy: requestedBy || song.info.requestedBy,
                _id: song.info._id || this._generateID()
            },
            track: song.track,
            voteID: song.voteID
        };
        if (this.skipVote.count) {
            this.skipVote.callback(this.skipVote.id === song.voteID ? 'started' : 'ended');
            this.resetVote();
        } 
        if (this.player.paused) {
            this.player.setPause(false);
        }
        return this.nowPlaying;
    }

    /**
     * Start the inactivity timeout for this guild
     * @returns {void}
     */
    startInactivityTimeout() {
        this.inactivityTimeout = setTimeout(() => {
            if ((this.inactiveSince && Date.now() - this.inactiveSince > this.client.config.options.music.inactivityTimeout) || this.client.bot.guilds.get(this.player.guildId).channels.get(this.player.channelId).voiceMembers.size <= 1) {
                this.leave();
            }
        }, this.client.config.options.music.inactivityTimeout);
    }

    /**
     * Reset a currently ongoing vote
     * @returns {object} - The clean vote object
     */
    resetVote() {
        const vote = {
            count: 0,
            id: null,
            callback: null,
            timeout: null,
            voted: []
        };
        if (this.skipVote) {
            clearTimeout(this.skipVote.timeout);
        }
        this.skipVote = vote;
        return vote;
    }

    /**
     * The total duration of the queue
     * @returns {Number} The total duration of the queue in ms
     */
    get queueDuration() {
        let total = 0;
        for (let i = 0; i < this.queue.length; i++) {
            total += this.queue[i].info.length;
        }
        return total;
    }

    /**
     * Leave the voice channel and tell the MusicManager that this connection can be dropped
     * @returns {Promise<void>} hi
     */
    async leave() {
        await this.client.bot.leaveVoiceChannel(this.player.channelId);
        // @ts-ignore
        this.emit("inactive");
    }

    /**
     * Clear the queue
     * @returns {void}
     */
    clearQueue() {
        this.queue = [];
        if (!this.client.handlers.RedisManager) {
            return;
        }
        return this.client.handlers.RedisManager.del(`${this.player.guildId}-queue`);
    }
    
    /**
     * @private
     * @returns {void}
     */
    _saveQueue() {
        if (this.client.handlers.RedisManager && this.client.handlers.RedisManager.healthy) {
            this.client.handlers.RedisManager.set(`${this.player.guildId}-queue`, JSON.stringify(this.queue))
                .catch(err => this.client.bot.emit("error", err));
        }
    }

    _handleDisconnection(err) {
        if (err) {
            this.client.bot.emit('error', err);
        }
        this.leave();
    }

    _handleError(err) {
        if (err.type === 'TrackExceptionEvent') {
            return this._resume();
        }
        this.client.bot.emit('error', err);
        this.leave();
    }

    _handleStuck(msg) {
        console.log(msg);
        this._resume();
    }

    async _handleEnd(data) {
        this.player.state.position = 0;
        if (data.reason && data.reason === 'REPLACED') {
            return;
        }
        if (this.repeat === 'song') {
            return this.play(this.nowPlaying);
        }
        this.nowPlaying = null;
        if (this.queue[0]) {
            this.play(this.queue[0]);
            if (this.repeat === "queue") {
                this.queue.push(this.queue[0]);
            }
            this.queue.shift();
            return this._saveQueue();
        }
        this.startInactivityTimeout();
    }

    /**
     * Called when a song gets stuck/run into a TrackExceptionEvent
     * @private
     * @returns {void}
     */
    _resume() {
        //Experimental attempt at resuming where a song got stuck/ran into an error
        const lastPosition = this.player.state.position;
        this.play(this.nowPlaying, null, (!this.nowPlaying.info.isStream ? { startTime: lastPosition } : null));
    }

    /**
     * @private
     * @returns {Number} A unique identifier
     */
    _generateID() {
        return Date.now() * process.pid;
    }
}

module.exports = MusicConnection;