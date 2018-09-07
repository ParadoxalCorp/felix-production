/**   
* @typedef {import("../../main.js").Client} Client
* @typedef {import("../Command.js").PartialCommandOptions} PartialCommandOptions
* @typedef {import("../Contexts/SettingsContext")} SettingsContext
* @typedef {import("eris").Message} Message
*/

const Command = require('../Command');

class SettingsCommands extends Command {
    /**
     * 
     * @param {Client} client - The client instance
     * @param {PartialCommandOptions}  commandOptions - The general command configuration
     * @param {{noArgs: string}} [options]  - `noArgs` specify a message to return if no arguments are provided.
     * These args will make the command handler act before running the command
     */
    constructor(client, commandOptions, options = {}) {
        super(client, { ...commandOptions, category: {
            name: 'Settings',
            emote: 'gear',
            conf: {
                requireDB: true,
                guildOnly: true
            }
        }});
        this.options = options;
    }

    genericPossibleActions(feature, dm = false) {
        return [{
            name: "enable",
            func: this.toggleFeature.bind(this, feature, 'enable'),
            interpretAs: "{value}",
            expectedArgs: 0
        }, {
            name: "disable",
            func: this.toggleFeature.bind(this, feature, 'disable'),
            interpretAs: "{value}",
            expectedArgs: 0
        }, {
            name: "set_message",
            func: this.setMessage.bind(this, feature),
            interpretAs: "{value}",
            expectedArgs: 1
        }, {
            name: "set_message_target",
            func: this.setMessageTarget.bind(this, feature, dm),
            interpretAs: "{value}",
            expectedArgs: 1
        }, {
            name: "see_settings",
            func: this.seeSettings.bind(this),
            interpretAs: "{value}",
            expectedArgs: 0
        }];
    }

    genericExpectedArgs(expectedArgs) {
        return [...[{
            description: "Please specify the action you want to do in the following possible actions: " + this.extra.possibleActions.map(a => `\`${a.name}\``).join(", "),   
            possibleValues: this.extra.possibleActions
        }], ...expectedArgs];
    }

    /**
     * 
     * @param {SettingsContext} context - The context
     * @returns {Promise<Object>} Whether the check passed
     */
    categoryCheck(context) {
        if (!this.run) {
            const action = this.extra.possibleActions.find(a => a.name === context.args[0]);
            if (!action) {
                return context.message.channel.createMessage(`:x: The specified action is invalid, if you are lost, simply run the command like \`${context.prefix}${this.help.name}\``);
            }
            //If the command isn't ran without args and the args aren't what's expected, to not conflict with the skipping in conditions
            if (((this.help.name === 'experience' && context.message.content.split(/\s+/g).length !== 2) || this.help.name !== 'experience') && (action.expectedArgs > context.args.length - 1)) {
                return context.message.channel.createMessage(`:x: This action expect \`${action.expectedArgs - (context.args.length - 1)}\` more argument(s), if you are lost, simply run the command like \`${context.prefix}${this.help.name}\``);
            }
            if (this.help.name === 'sar') {
                context.guildEntry.selfAssignableRoles = context.guildEntry.selfAssignableRoles.filter(r => context.guild.roles.has(r.id));                        
            }
            return {
                passed: true,
                callback: action.func
            };
        } else {
            return { passed: true };
        }
    }

    /**
     * 
     * @param {String} feature - The type of the feature to enable, either `greetings`, `farewells` or `experience`
     * @param {String} toggle - Either `disable` or `enable`
     * @param {SettingsContext} context - The context
     * @returns {Promise<Message>} The message confirming the success of the action
     */
    async toggleFeature(feature, toggle, context) {
        const enable = toggle === "enable" ? true : false;
        if (enable ? !context.guildEntry[feature].enabled : context.guildEntry[feature].enabled) {
            context.guildEntry[feature].enabled = enable;
            await context.guildEntry.save();
            const additionalInfo = ['greetings', 'farewells'].includes(feature) ? `Make sure to also set up a ${feature} message and the target` : '';
            if (enable) {
                return context.message.channel.createMessage(`:white_check_mark: Alright, the ${feature} feature is now enabled. ${additionalInfo}`);
            } else {
                return context.message.channel.createMessage(`:white_check_mark: Alright, the ${feature} feature is now disabled`);
            }
        } else {
            return context.message.channel.createMessage(`:x: The ${feature} feature is already ${toggle}d`);
        }
    }

    /**
     * @param {String} feature - The feature to set the message for, can be either `greetings` or `farewells`
     * @param {SettingsContent} context - The context
     * @returns {Promise<Message>} The message confirming the success of the action
     */
    async setMessage(feature, context) {
        if (!context.args[1]) {
            return context.message.channel.createMessage(`:x: You must specify the new ${feature} message to use`);
        }
        context.guildEntry[feature].message = context.args[2]
            ? context.args.splice(1).join(" ")
            : context.args[1];
        await context.guildEntry.save();
        return context.message.channel.createMessage(`:white_check_mark: Alright, the ${feature} message has been updated`);
    }

    /**
     * 
     * @param {String} feature - The feature to set the message target for, can be either `greetings` or `farewells`
     * @param {Boolean} dm - Whether dms are allowed as target
     * @param {SettingsContext} context - The context
     * @returns {Promise<Message>} The message confirming the success of the action
     */
    async setMessageTarget(feature, dm, context) {
        if (context.args[1].toLowerCase() === "dm" && dm) {
            if (context.guildEntry[feature].channel === context.args[1].toLowerCase()) {
                return context.message.channel.createMessage(`:x: The ${feature} target is already set to \`${context.args[1].toLowerCase()}\``);
            }
            context.guildEntry[feature].channel = context.args[1].toLowerCase();
            await context.guildEntry.save();
            return context.message.channel.createMessage(`:white_check_mark: Alright, the ${feature} target has been updated`);
        }
        const channel = await context.getChannelFromText(context.args[1]);
        if (!channel) {
            return context.message.channel.createMessage(`:x: I couldn't find a channel named \`${context.args[1]}\` on this server`);
        } else if (context.guildEntry[feature].channel === channel.id) {
            return context.message.channel.createMessage(`:x: The ${feature} target is already set to the channel <#${channel.id}>`);
        }
        context.guildEntry[feature].channel = channel.id;
        await context.guildEntry.save();
        const hasPerm = context.hasPerms(['sendMessages'], undefined, channel);
        return context.message.channel.createMessage(`:white_check_mark: Alright, the ${feature} target has been set to the channel <#${channel.id}>` + (
            !hasPerm
                ? `\n\n:warning: It seems like i don\'t have enough permissions to send messages in <#${channel.id}>, you may want to fix that`
                : ""));
    }

    /**
     * 
     * @param {String} feature - The feature to set the message target for, can be either `greetings` or `farewells`
     * @param {SettingsContext} context - The context
     * @returns {String} A warning string if missing permissions
     */
    checkChannelPermissions(feature, context) {
        let result = "";
        const channel = context.guild.channels.get(context.guildEntry[feature].channel);
        if (channel) {
            result += !context.hasPerms(["sendMessages"], undefined, channel) ?
                `:warning: I don't have enough permissions to send messages in <#${channel.id}>\n` :
                ""; 
        }
        if (!result) {
            result = ":white_check_mark: No permissions issues have been detected with the current settings";
        }
        return result;
    }

    /**
     * @param {String} feature - The feature to check the role permissions for, can be either `sar`, `ojr` or `experience`
     * @param {SettingsContext} context - The context
     * @returns {String} A warning string if missing permissions, otherwise an empty string
     */
    checkRolePermissions(feature, context) {
        let result = '';
        let targetFeature = { experience: context.guildEntry.experience.roles, sar: context.guildEntry.selfAssignableRoles, ojr: context.guildEntry.onJoinRoles }[feature];
        const channel = feature === 'experience' ? context.message.channel.guild.channels.get(context.guildEntry.experience.notifications.channel) : null;
        if (channel) {
            result += !context.hasPerms(['sendMessages'], undefined, channel) ? `:warning: I don't have enough permissions to send messages in <#${channel.id}>\n` : '';
        }
        if (!context.hasPerms(['manageRoles']) && (feature === 'experience' ? targetFeature[0] : targetFeature[0])) {
            result += ':warning: I don\'t have the `Manage Roles` permission and there are roles set to be given\n';
        }
        targetFeature = targetFeature.filter(r => context.guild.roles.has(r.id || r));
        const higherRoles = targetFeature.filter(r => context.guild.roles.get(r.id || r).position > this.getHighestRole(context.clientMember.id, context.guild).position);
        if (higherRoles[0]) {
            const setAs = feature === 'experience' ? 'to be given at some point' : (feature === 'ojr' ? 'to be given to new members' : 'as self-assignable');
            result += ':warning: The role(s) ' + higherRoles.map(r => `\`${context.guild.roles.get(r.id || r).name}\``).join(', ') + ' is/are set ' + setAs + ', however it is/they are higher than my highest role and i therefore can\'t give it/them';
        }
        if (!result) {
            result = ':white_check_mark: No permissions issues have been detected with the current settings';
        }
        return result;
    }
}

module.exports = SettingsCommands;