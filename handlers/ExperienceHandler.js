'use strict';

/** @typedef {import("../main.js").Client} Client */

/**
 * @typedef LevelDetails 
 * @prop {number} level The level  
 * @prop {number} nextLevel The next level (basically level + 1 yes)
 * @prop {number} thisLevelExp The experience required to reach this level
 * @prop {number} nextLevelExp The experience required to reach the next level
 */

class ExperienceHandler {

    /**
     * Creates an instance of ExperienceHandler.
     * @param {Client} client client
     * @memberof ExperienceHandler
     */
    constructor(client) {
        /** @type {Client} */
        this.client = client;
        /** @type {import("../utils/Collection")} */
        this.cooldowns = new client.Collection();
        this._sweepInterval = setInterval(this._sweep.bind(this), client.config.options.experience.sweepInterval);
        this.levelledUp = new client.Collection();
    }

    async handle(message, guildEntry, userEntry) {
        if (this.cooldowns.has(message.author.id)) {
            return;
        }
        const totalSize = message.attachments[0] ? (() => {
            let totalUploadSize = 0;
            for (const file of message.attachments) {
                totalUploadSize = totalUploadSize + file.size;
            }
            return totalUploadSize;
        })() : false;
        const expGain = totalSize ? this.client.config.options.experience.uploadGainFormula(totalSize) : this.client.config.options.experience.gainFormula(message.content.length);
        const levelDetails = this.client.handlers.ExperienceHandler.getLevelDetails(guildEntry.getLevelOf(message.author.id));
        const totalExperience = guildEntry.addExperience(expGain).to(message.author.id);
        userEntry.addExperience(expGain);
        this._addCooldown(this.client.config.options.experience.cooldown).to(message.author.id);
        await Promise.all([this.client.handlers.DatabaseWrapper.set(guildEntry, 'guild'), this.client.handlers.DatabaseWrapper.set(userEntry, 'user')]);
        if ((totalExperience >= levelDetails.nextLevelExp) && (this.levelledUp.get(message.author.id) !== levelDetails.nextLevel)) {
            this.levelledUp.set(message.author.id, levelDetails.nextLevel);
            const wonRoles = guildEntry.experience.roles.find(r => r.at <= levelDetails.nextLevel) ? await this._addWonRoles(message, guildEntry, levelDetails) : false;
            if (guildEntry.experience.notifications.enabled) {
                // @ts-ignore
                this._notifyUser(message, guildEntry, levelDetails, wonRoles.text);
            }
            await this._removeHigherRoles(message, guildEntry, levelDetails);
            if (wonRoles) {
                // @ts-ignore
                this._removeOlderRoles(message, guildEntry, levelDetails, wonRoles.roles);
            }
        }
        return true;
    }

    /**
     * Get some information about the given level
     * @param {Number} level - The level to get the details from
     * @returns {LevelDetails} The given level details
     */
    getLevelDetails(level) {
        return {
            level: level,
            nextLevel: level + 1,
            thisLevelExp: Math.floor(this.client.config.options.experience.baseXP * (level ** this.client.config.options.experience.exponent)),
            nextLevelExp: Math.floor(this.client.config.options.experience.baseXP * ((level + 1) ** this.client.config.options.experience.exponent))
        };
    }

    _sweep() {
        for (const [key, value] of this.cooldowns) {
            if (value < Date.now()) {
                this.cooldowns.delete(key);
            }
        }
    }

    _addCooldown(duration) {
        return {
            to: (id) => {
                this.cooldowns.set(id, Date.now() + duration);
            }
        };
    }

    async _addWonRoles(message, guildEntry, levelDetails) {
        guildEntry.experience.roles = guildEntry.experience.roles.filter(r => message.channel.guild.roles.has(r.id));
        const member = message.channel.guild.members.get(message.author.id);
        let wonRoles = guildEntry.experience.roles.filter(r => r.at <= levelDetails.nextLevel && !member.roles.includes(r.id))
            .map(r => {
                r.reason = r.at === levelDetails.nextLevel ? `This role is set to be given at the level ${r.at}` : `This role is set to be given at the level ${r.at} and the member is level ${levelDetails.nextLevel}`;
                return r;
            });
        let highestRoles = guildEntry.experience.roles.filter(r => member.roles.includes(r.id)).concat(wonRoles).sort((a, b) => b.at - a.at);
        let highestRequirement = highestRoles[0] ? highestRoles[0].at : false;
        if (highestRequirement) {
            wonRoles = wonRoles.filter(r => r.at === highestRequirement || r.static);
        }
        const handleError = (id) => {
            wonRoles = wonRoles.filter(r => r.id !== id);
        };
        for (const role of wonRoles) {
            await member.addRole(role.id, role.reason)
                .catch(handleError.bind(role.id))
                .then(() => {
                    message.channel.guild.members.get(message.author.id).roles.push(role.id);
                });
        }
        return wonRoles[0] ? {text: wonRoles.map(r => '`' + message.channel.guild.roles.get(r.id).name + '`'), roles: wonRoles} : false;
    }

    async _removeHigherRoles(message, guildEntry, levelDetails) {
        const member = message.channel.guild.members.get(message.author.id);
        const higherRoles = guildEntry.experience.roles.filter(r => member.roles.includes(r.id) && levelDetails.nextLevel < r.at);
        if (higherRoles[0]) {
            for (const role of higherRoles) {
                await member.removeRole(role.id, `This role is set to be given at the level ${role.at} but this member is only level ${levelDetails.nextLevel}`)
                .catch(() => {});
            }
        }
        return higherRoles;
    }

    _notifyUser(message, guildEntry, levelDetails, wonRoles) {
        const user = new this.client.structures.ExtendedUser(message.author, this.client.bot);
        const wonRolesNotif = wonRoles ? `and won the role(s) ${wonRoles.join(', ')}` : false;
        let notif = (guildEntry.experience.notifications.message || this.client.config.options.experience.defaultLevelUpMessage)
            .replace(/%USERTAG%/g, user.tag)
            .replace(/%USER%/g, `<@${user.id}>`)
            .replace(/%USERNAME%/g, user.username)
            .replace(/%LEVEL%/g, levelDetails.nextLevel)
            .replace(/%WONROLES%/g, wonRoles ? wonRolesNotif : '');
        if (guildEntry.experience.notifications.channel) {
            if (guildEntry.experience.notifications.channel === 'dm') {
                return user.createMessage(notif).catch(() => {});
            } else if (!message.channel.guild.channels.get(guildEntry.experience.notifications.channel)) {
                return message.channel.createMessage(notif).catch(() => {});
            }
            message.channel.guild.channels.get(guildEntry.experience.notifications.channel).createMessage(notif).catch(() => {});
        } else {
            message.channel.createMessage(notif).catch(() => {});
        }
    }

    async _removeOlderRoles(message, guildEntry, levelDetails) {
        const member = message.channel.guild.members.get(message.author.id);
        let highestRoles = guildEntry.experience.roles.filter(r => member.roles.includes(r.id)).sort((a, b) => b.at - a.at);
        let highestRequirement = highestRoles[0] ? highestRoles[0].at : false;
        highestRoles = highestRoles.filter(r => r.at === highestRequirement);
        const lowerRemovableRoles = guildEntry.experience.roles.filter(r => r.at < levelDetails.nextLevel && !r.static && member.roles.includes(r.id) && !highestRoles.find(role => r.id === role.id));
        if (lowerRemovableRoles[0]) {
            for (const role of lowerRemovableRoles) {
                await this.client.utils.sleep(1000);
                member.removeRole(role.id, `This role isn't set as static and the member won a higher role`).catch(() => {});
            }
        }
    }
}

module.exports = ExperienceHandler;