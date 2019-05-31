
/** 
 * @typedef {import('eris').Message} Message 
 * @typedef {import('../Cluster')} Client
 * @typedef {import('../structures/GuildEntry')} GuildEntry 
 * @typedef {import('../structures/UserEntry')} UserEntry 
 * @typedef {import('../structures/Command')} Command
 */

const Collection = require("eris").Collection;

module.exports = new class MessageCreateHandler {
    constructor() {
        /** @type {Map<string, number>} */
        // @ts-ignore
        this.cooldowns = new Collection(undefined);
        this._cooldownSweep = setInterval(this._sweepCooldowns.bind(this), 60000 * 30);
    }

    /**
     *
     * Handles messageCreate events
     * @param {Client} client The client instance
     * @param {Message} msg The message
     * @returns {Promise<void | Message>} Nothing
     */
    async handle (client, msg) {
        if (msg.author.bot) {
            return;
        }
        const userEntry = await client.db.getUser(msg.author.id);
        const guildEntry = msg.member.guild ? await client.db.getGuild(msg.member.guild.id) : null;
        if (this.cooldowns.has(msg.author.id) && this.cooldowns.get(msg.author.id) > Date.now()) {
            return this._userInCooldown(client, msg, userEntry, guildEntry);
        }
        const command = client.utils.parseCommand(msg, guildEntry);
        if (!command) {
            return;
        }
        if (!this.memberHasPermissions(client, msg, userEntry, guildEntry, command)) {
            return msg.channel.createMessage(client.i18n("generic.missing-permissions", { lng: userEntry.props.lang || (guildEntry ? guildEntry.props.lang : false) || "en-US" })).catch(() => {});
        }
        const toSplice = guildEntry ? (guildEntry.props.spacedPrefix || msg.content.startsWith(`<@${client.user.id}>`) || msg.content.startsWith(`<@!${client.user.id}`) ? 2 : 1) : 2;
        const args = msg.content.split(/\s+/gim).splice(toSplice);
        const validatedArgs = client.utils.validateArgs(args, command, userEntry, guildEntry);
        if (validatedArgs !== true) {
            // @ts-ignore
            return msg.channel.createMessage(validatedArgs).catch(() => {});
        }
        const parsedArgs = client.utils.parseArgs(args, command);
        const ctx = new client.structures.Context(msg, client, guildEntry, userEntry, parsedArgs);
        const comparedPermissions = client.utils.comparePermissions(msg, ctx.clientMember, command.requiredPerms, msg.channel);
        if (!comparedPermissions.allowed) {
            return ctx.sendLocale("generic.bot-missing-perms", { perms: comparedPermissions.missingPerms.map(p => "`" + p + "`").join(", ")}).catch(() => {});
        }
        const output = await command.run(ctx).catch((err) => {
            err._ctx = ctx;
            client.emit("error", err);
        });
        this.cooldowns.set(msg.author.id, Date.now() + command.cooldown);
        if (typeof output === "string" || (typeof output === "object" && output.embed)) {
            return msg.channel.createMessage(output).catch((err) => {
                err._ctx = ctx;
                client.emit("error", err);
            });
        }
    }

    /**
     *
     * Checks if the message author has permissions to run the command
     * @param {Client} client The client instance
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
            // @ts-ignore
            allowed = guildEntry.memberHasPermission(msg.author.id, command, msg.channel);
        }
        if (msg.member.guild && command.guildOwnerOnly && (msg.author.id !== msg.member.guild.ownerID)) {
            allowed = false;
        }
        return allowed;
    }

    /**
     *
     * Checks if the message author has permissions to run the command
     * @param {Client} client The client instance
     * @param {Message} msg The message
     * @param {Command} command The command
     * @returns {Boolean} Whether the message author is allowed to use this command
     */
    _checkDefaultPermissions(client, msg, command) {
        let allowed;

        if (client.models.defaultPermissions.allowedCommands.includes(`${command.category}*`)) {
            allowed = true;
        }
        if (client.models.defaultPermissions.restrictedCommands.includes(`${command.category}*`)) {
            allowed = false;
        }
        if (client.models.defaultPermissions.allowedCommands.includes(command.name)) {
            allowed = true;
        }
        if (client.models.defaultPermissions.restrictedCommands.includes(command.name)) {
            allowed = false;
        }

        if (msg.member.guild && msg.member.guild.members.get(msg.author.id).permission.has("administrator")) {
            allowed = true;
        }

        if (command.category === "admin") {
            allowed = process.env.ADMINS.includes(msg.author.id);
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

    /**
     * 
     * @param {Client} client The client instance
     * @param {Message} msg The message
     * @param {UserEntry} userEntry The user entry
     * @param {GuildEntry} guildEntry The guild entry
     * @returns {Promise<Message>} The message
     */
    async _userInCooldown(client, msg, userEntry, guildEntry) {
        const seconds = Math.round((this.cooldowns.get(msg.author.id) - Date.now()) / 1000);
        const string = seconds > 1 ? "generic.in-cooldown-plural" : "generic.in-cooldown-singular";
        try {
            return msg.channel.createMessage(client.i18n(string, { lng: userEntry.props.lang || (guildEntry ? guildEntry.props.lang : false) || "en-US", seconds }));
        }
        catch (e) { }
    }
}();