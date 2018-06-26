'use strict';

const Redis = require('ioredis');

class RedisManager extends Redis {
    constructor(client) {
        super({
            port: client.config.redis.port,
            host: client.config.redis.host,
            family: client.config.redis.family,
            db: client.config.redis.db,
            password: client.config.redis.password,
            lazyConnect: true
        });
        this.felix = client;
        this.on('connect', this._handleConnection.bind(this));
        this.on('error', this._handleError.bind(this));
        this.on('close', this._handleClosedConnection.bind(this));
        this.on('reconnecting', this._handleReconnection.bind(this));
        this.on('ready', this._ready.bind(this));
        this.on('end', this._handleEnd.bind(this));
        if (client.config.redis.enabled) {
            this.connect();
        }
        this.failing = false;
        this.knownErrors = {
            "err-invalid-password": true,
            "noauth-authentification-required": true
        };
    }

    _handleConnection() {
        process.send({name: 'info', msg: `Successfully reached the Redis server at ${this.felix.config.redis.host}:${this.felix.config.redis.port}`});
    }

    _ready() {
        process.send({name: 'info', msg: `Successfully connected to the Redis server at ${this.felix.config.redis.host}:${this.felix.config.redis.port}`});
    }

    _handleError(err) {
        process.send({name: 'error', msg: `Failed to connect to the Redis server at ${this.felix.config.redis.host}:${this.felix.config.redis.port}`});
        if (this.knownErrors[err.message.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')]) {
            this.disconnect();
        }
        if (!this.failing) {
            this.felix.bot.emit('error', err);
            this.failing = true;
        }
    }

    _handleClosedConnection() {
        process.send({name: 'warn', msg: `The connection with the Redis server at ${this.felix.config.redis.host}:${this.felix.config.redis.port} has been closed`});
    }

    _handleReconnection(ms) {
        process.send({name: 'warn', msg: `Attempting to re-connect to the Redis server in ${ms}ms`});
    }

    _handleEnd() {
        process.send({name: 'error', msg: `Failed to connect to the Redis server at ${this.felix.config.redis.host}:${this.felix.config.redis.port}, no more re-connection attempts will be made`});
    }

    get healthy() {
        return this.status === 'ready' ? true : false;
    }
}

module.exports = RedisManager;