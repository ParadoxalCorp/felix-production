/**
 * @typedef {import("../References.js").GuildEntry} GuildEntry
 * @typedef {import("../../main.js").Client} Client
 * @typedef {import("../Command.js")} Command
 * @typedef {import("eris").TextChannel} TextChannel
 * @typedef {import("../References").GuildMember} GuildMember
 * */

/** @typedef {Function} ToMember
  * @param {String} id The ID of the member to add experience to
 */

/** @typedef {Object} AddExperienceInterface
  * @prop {ToMember} to Defines to who the amount of experience should be added
  */

/** @class ExtendedGuildEntry */
class ExtendedGuildEntry {
    /**
     * 
     * @param {GuildEntry} guildEntry - The guild entry
     * @param {Client} client - The client instance
     */
    constructor(guildEntry, client) {
        Object.assign(this, guildEntry);
        /** @type {Client} The client instance */
        this.client = client;
    }

    get getPrefix() {
        // @ts-ignore
        return this.prefix || this.client.config.prefix;
    }

    /**
     * Check if the specified member has the permission to run the given command
     * @param {String} memberID - The member ID to check if they have the permission to run the specified command
     * @param {Command} command - The command
     * @param {TextChannel} channel - The channel in which the command is attempted to be used
     * @returns {Boolean} Whether or not the specified member is allowed to use the given command
     */
    memberHasPermission(memberID, command, channel) {
        let allowed;
        // @ts-ignore
        const member = this.client.bot.guilds.get(this.id).members.get(memberID);
        //Filter the user roles that aren't in the database, sort them by position and finally map them to iterate through them later
        // @ts-ignore
        const rolesInDB = member.roles.filter(role => this.permissions.roles.find(r => r.id === role)).sort((a, b) => member.guild.roles.get(a).position -
            member.guild.roles.get(b).position).map(r => { return { name: "roles", id: r }; });
        [
            { name: this.client.structures.References.defaultPermissions }, 
            { name: "global" }, 
            { name: "categories", id: channel.parentID }, 
            { name: "channels", id: channel.id }, 
            ...rolesInDB, 
            { name: "users", id: member.id }
        ].forEach(val => {
            if (this.getPrioritaryPermission(val.name, command, val.id) !== undefined) {
                allowed = this.getPrioritaryPermission(val.name, command, val.id);
            }
        });
        if (member.permission.has("administrator")) {
            allowed = true;
        }
        if (command.conf.hidden) {
            if (this.client.config.admins.includes(member.id)) {
                allowed = command.conf.ownerOnly && this.client.config.ownerID !== member.id ? false : true;
            } else {
                allowed = false;
            }
        }

        return allowed;
    }

    /**
     * Get the prioritary permission of a target and check if they are allowed to use the given command
     * @param {String} target - The name of the permissions to check ("channels", "roles", "users"..) OR an array/object following the exact same structure than the rest
     * @param {Command} command - The command
     * @param {String} [targetID] - Optional, the ID of the target to get the prioritary permission for
     * @returns {Boolean} Whether or not the target is allowed to use the command
     */
    getPrioritaryPermission(target, command, targetID) {
        let targetPos;
        if (typeof target !== 'string') {
            if (Array.isArray(target)) {
                // @ts-ignore
                targetPos = target.find(t => t.id === targetID);
            } else {
                targetPos = target;
            }
        } else {
            // @ts-ignore
            if (Array.isArray(this.permissions[target])) {
                // @ts-ignore
                targetPos = this.permissions[target].find(t => t.id === targetID);
            } else {
                // @ts-ignore
                targetPos = this.permissions[target];
            }
        }
        let isAllowed;
        if (!targetPos) {
            return undefined;
        }
        //Give priority to commands over categories by checking them after the categories
        let priorityOrder = ['*', `${(command.category.name.toLowerCase())}*`, command.help.name];
        for (const permission of priorityOrder) {
            if (targetPos.allowedCommands.includes(permission)) {
                isAllowed = true;
            } else if (targetPos.restrictedCommands.includes(permission)) {
                isAllowed = false;
            }
        }
        return isAllowed;
    }

    /**
     * Get the activity level of a member
     * @param {String} id The ID of the member to get the level from
     * @returns {Number} The level
     * @example Guild.getLevelOf("123456789");
     */
    getLevelOf(id) {
        // @ts-ignore
        const member = this.experience.members.find(m => m.id === id) || this.client.structures.References.guildMember(id);
        return Math.floor(Math.pow(member.experience / this.client.config.options.experience.baseXP, 1 / this.client.config.options.experience.exponent));
    }

    /**
     * Get the activity-related member object of a member of the guild
     * @param {String} id - The ID of the member
     * @returns {GuildMember} The member object
     * @example Guild.getMember("123456789");
     */
    getMember(id) {
        // @ts-ignore
        return this.experience.members.find(m => m.id === id) || this.client.structures.References.guildMember(id);
    }

    /**
     * 
     * 
     * @param {Number} amount - The amount of experience to add 
     * @returns {AddExperienceInterface} An object, with a .to(id) callback function to call with the ID of the member to add the experience to. 
     * @example Guild.addExperience(15).to("123456798");
     */
    addExperience(amount) {
        return {
            to: (id) => {
                // @ts-ignore
                let member = this.experience.members[this.experience.members.findIndex(m => m.id === id)];
                if (!member) {
                    // @ts-ignore
                    this.experience.members.push(this.client.structures.References.guildMember(id));
                    // @ts-ignore
                    member = this.experience.members[this.experience.members.findIndex(m => m.id === id)];
                }
                member.experience = member.experience + amount;
                return member.experience;
            }
        };
    }

    /**
     * Remove a role set to be given at a certain level
     * @param {String} id - The ID of the role to remove
     * @returns {ExtendedGuildEntry} This guild entry so calls can be chained
     * @example Guild.removeActivityRole("123456789");
     */
    removeActivityRole(id) {
        // @ts-ignore
        this.experience.roles.splice(this.experience.roles.findIndex(r => r.id === id), 1);
        // @ts-ignore
        return this;
    }

    /**
     * Check if the guild has the premium status
     * @returns {Boolean} Whether the guild has the premium status or not 
     */
    hasPremiumStatus() {
        // @ts-ignore
        if (typeof this.premium === 'number') {
            // @ts-ignore
            return this.premium > Date.now();
        } else {
            // @ts-ignore
            return this.premium ? true : false;
        }
        
    }

    /**
     * Return this without the additional methods, essentially returns a proper database entry, ready to be saved into the database
     * Note that this shouldn't be called before saving it into the database, as the database wrapper already does it
     * @returns {GuildEntry} - This, as a proper database entry object (without the additional methods)
     */
    toDatabaseEntry() {
        const cleanObject = (() => {
            const newObject = {};
            for (const key in this) {
                if (typeof this[key] !== 'function' && key !== 'client') {
                    newObject[key] = this[key];
                }
            }
            return newObject;
        })();
        return cleanObject;
    }

    /**
     * Save this guild entry in the database
     * @returns {Promise<GuildEntry>} - The saved entry
     */
    save() {
        return this.client.handlers.DatabaseWrapper.set(this, 'guilds');
    }
}

module.exports = ExtendedGuildEntry;