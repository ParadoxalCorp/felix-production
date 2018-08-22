const FunCommands = require('../../structures/CommandCategories/FunCommands');

class Choose extends FunCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'choose',
                description: 'Make felix choose between some stuff',
                usage: '{prefix}choose <choice> ; <choice_2> ; <and_another_one>',
            },
        }, { noArgs: `:x: Well, I need some stuff to choose from, I can't choose from nothing sadly :v` });
    }

    /** @param {import("../../structures/Contexts/FunContext")} context */
    
    async run(context) {
        let choices = context.args.join(' ').split(/;/g).filter(c => c && c !== ' '); //Filter empty choices :^)
        if (choices.length < 2) {
            return context.message.channel.createMessage(`:x: Welp I need to choose from at least two things, I mean what's the point in choosing between only one thing?`);
        }
        let choice = choices[Math.floor(Math.random() * choices.length)].trim();
        context.message.channel.createMessage(`I choose \`${choice}\`!`);
    }
}

module.exports = Choose;