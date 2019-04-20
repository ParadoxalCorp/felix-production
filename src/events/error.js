/** 
 * @typedef {import('../Cluster')} Client
 * @typedef {import('../structures/Context')} Context
 */

/** 
 * @typedef {Object} CustomError
 * @prop {Number} [code] The code of the error
 * @prop {Context} [_ctx] The context, if the error originated from a command
 */

/**
 * @typedef {CustomError & Error} BotError
 */

const errors = {
    50001: {
        discard: true,
        message: true
    },
    50007: {
        discard: true,
        message: true
    },
    50013: {
        discard: true,
        message: true
    }
};

module.exports = new class ErrorHandler {

    /**
     * Handles error events
     * @param {Client} client The client instance
     * @param {BotError} err The error
     * @returns {Promise<void>} Nothing useful
     */
    async handle(client, err) {
        const identified = this.identifyError(err);
        if (identified) { 
            if (identified.message && err._ctx) {
                err._ctx.sendLocale(`errors.${err.code}`).catch(() => {});
            }
            if (identified.discard) {
                return;
            }
        }
        client.logger.error({ src: "ErrorHandler", msg: `\n${err.stack}` });
        if (err._ctx) {
            // @ts-ignore
            err._ctx = { message: err._ctx.msg, userEntry: err._ctx.userEntry, guildEntry: err._ctx.guildEntry  };
        }
        client.sentry.captureException(err);
    }

    identifyError(err) {
        for (const code in errors) {
            if (Number(code) === err.code || err.message.includes(`[${code}]`)) {
                return errors[code];
            }
        }
    } 

}