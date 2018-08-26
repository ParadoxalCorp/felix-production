const MusicCommands = require('../../structures/CommandCategories/MusicCommands');

class Repeat extends MusicCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'repeat',
                description: 'Set the repeat to repeat the queue, the current song or turn it off',
                usage: '{prefix}repeat <song|queue|off>'
            },
            conf: {
                expectedArgs: [{
                    description: 'Please choose what repeat mode to toggle, can be either `queue` to repeat the queue, `song` to repeat the current song or `off` to disable the repeat',
                    possibleValues: [{
                        name: 'queue'
                    }, {
                        name: 'song'
                    }, {
                        name: 'off'
                    }]            
                }]
            }
        }, { userInVC: true, playing: true });
        this.extra = {
            off: {
                sentence: 'turned off the repeat',
                emote: ':arrow_forward:'
            },
            song: {
                sentence: 'set to repeat the current song',
                emote: ':repeat_one:'
            },
            queue: {
                sentence: 'set to repeat the queue',
                emote: ':repeat:'
            }
        };
    }
    /**
    * @param {import("../../structures/Contexts/MusicContext")} context The context
    */

    async run(context) {
        if (!context.args[0] || !['off', 'queue', 'song'].includes(context.args[0].toLowerCase())) {
            return context.message.channel.createMessage(':x: Please specify the repeat mode to toggle, can be either `queue` to repeat the queue, `song` to repeat the current song or `off` to disable the repeat');
        }
        context.connection.repeat = context.args[0].toLowerCase();
        if (context.connection.repeat === "queue") {
            if (context.connection.nowPlaying) {
                context.connection.addTrack(context.connection.nowPlaying);
            }
        }
        return context.message.channel.createMessage(`${this.extra[context.connection.repeat].emote} Successfully ${this.extra[context.connection.repeat].sentence}`);       
    }
}

module.exports = Repeat;