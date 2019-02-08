// @ts-nocheck
/** 
 * @typedef {import('eris').Message} Message 
 * @typedef {import('../Cluster')} Felix
 * @typedef {import('../structures/GuildEntry')} GuildEntry 
 * @typedef {import('../structures/UserEntry')} UserEntry 
 * @typedef {import('../structures/Command')} Command
 */

const Collection = require("eris").Collection;

module.exports = new class MessageCreate {
    constructor() {
        this.cooldowns = new Collection();
        this._cooldownSweep = setInterval(this._sweepCooldowns.bind(this), 60000 * 30);
    }

    /**
     *
     * Handles messageCreate events
     * @param {Felix} client The client instance
     * @param {Message} msg The message
     * @returns {Promise<void>} Nothing
     */
    async handle (client, msg) {
        if (msg.author.bot) {
            return;
        }
        const userEntry = await client.db.getUser(msg.author.id); 
        const guildEntry = msg.channel.guild ? await client.db.getGuild(msg.channel.guild.id) : null;
        if (this.cooldowns.has(msg.author.id) && this.cooldowns.get(msg.author.id) > Date.now()) {
            return msg.channel.createMessage(client.i18n("generic.in-cooldown", { lng: userEntry.props.lang || guildEntry.props.lang || "en-US", seconds: (this.cooldowns.get(msg.author.id) - Date.now()) / 1000 })).catch(() => {});
        }
        const command = client.utils.parseCommand(msg, guildEntry);
        if (!command) {
            return;
        }
        if (!this.memberHasPermissions(client, msg, userEntry, guildEntry, command)) {
            return msg.channel.createMessage(client.i18n("generic.missing-permissions", { lng: userEntry.props.lang || guildEntry.props.lang || "en-US" })).catch(() => {});
        }
        const toSplice = guildEntry ? (guildEntry.props.spacedPrefix || msg.content.startsWith(`<@${client.user.id}>`) || msg.content.startsWith(`<@!${client.user.id}`) ? 2 : 1) : 2;
        const args = msg.content.split(/\s+/gim).splice(toSplice);
        const validatedArgs = client.utils.validateArgs(args, command, userEntry, guildEntry);
        if (validatedArgs !== true) {
            return msg.channel.createMessage(validatedArgs).catch(() => {});
        }
        const parsedArgs = client.utils.parseArgs(args, command);
        const ctx = new client.structures.Context(msg, client, guildEntry, userEntry, parsedArgs);
        const output = await command.run(ctx);
        this.cooldowns.set(msg.author.id, Date.now() + command.cooldown);
        if (typeof output === "string" || output.embed) {
            return msg.channel.createMessage(output).catch(() => {});
        }
    }

    /**
     *
     * Checks if the message author has permissions to run the command
     * @param {Felix} client The client instance
     * @param {Message} msg The message
     * @param {UserEntry} userEntry The user entry
     * @param {GuildEntry} guildEntry The guild entry
     * @param {Command} command The command
     * @returns {Boolean} Whether the message author is allowed to use this command
     */
    memberHasPermissions(client, msg, userEntry, guildEntry, command) {
        let allowed = false;
        if (!guildEntry) {
            allowed = this._checkDefaultPermissions(client, msg, command);
        } else {
            allowed = guildEntry.memberHasPermission(msg.author.id, command, msg.channel);
        }
        if (msg.channel.guild && command.guildOwnerOnly && (msg.author.id !== msg.channel.guild.ownerID)) {
            allowed = false;
        }
        return allowed;
    }

    /**
     *
     * Checks if the message author has permissions to run the command
     * @param {Felix} client The client instance
     * @param {Message} msg The message
     * @param {Command} command The command
     * @returns {Boolean} Whether the message author is allowed to use this command
     */
    _checkDefaultPermissions(client, msg, command) {
        let allowed;

        if (client.models.defaultPermissions.allowedCommands.includes(`${command.help.category}*`)) {
            allowed = true;
        }
        if (client.models.defaultPermissions.restrictedCommands.includes(`${command.help.category}*`)) {
            allowed = false;
        }
        if (client.models.defaultPermissions.allowedCommands.includes(command.help.name)) {
            allowed = true;
        }
        if (client.models.defaultPermissions.restrictedCommands.includes(command.help.name)) {
            allowed = false;
        }

        if (msg.channel.guild && msg.member.guild.members.get(msg.author.id).permission.has("administrator")) {
            allowed = true;
        }

        if (command.help.category === "admin") {
            if (client.config.admins.includes(msg.author.id)) {
                allowed = command.ownerOnly && client.config.ownerID !== msg.author.id ? false : true;
            } else {
                allowed = false;
            }
        }

        return allowed;
    }

    _sweepCooldowns() {
        for (const [key, value] of this.cooldowns) {
            if (value < Date.now()) {
                this.cooldowns.delete(key);
            }
        }
    }
}();