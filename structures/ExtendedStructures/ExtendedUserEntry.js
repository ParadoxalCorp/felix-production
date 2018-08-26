/** @typedef {import("../References").UserEntry} UserEntry
 * @typedef {import("../references.js").TierLimits} TierLimits
 * @typedef {import("../../main.js").Client} Client
*/

const references = require('../References');
const config = require('../../config');

class ExtendedUserEntry {
    /**
     * 
     * @param {UserEntry} userEntry - The user entry
     * @param {Client} client - The client instance
     */
    constructor(userEntry, client) {
        Object.assign(this, userEntry);
        /** @type {Client} The client instance */
        this.client = client;
    }

    /**
     * Check if a user has the specified item
     * @param {Number} itemID - The ID of the item 
     * @returns {Boolean} Whether or not the user has the specified item
     */
    hasItem(itemID) {
        // @ts-ignore
        return this.economy.items.find(i => i.id === itemID) ? true : false;
    }

    /**
     * Add an item to the user entry, handle already owned items cases (increment the count). This modifies the object
     * @param {Number} itemID - The ID of the item to add
     * @returns {void}
     */
    addItem(itemID) {
        if (this.hasItem(itemID)) {
            // @ts-ignore
            this.economy.items[this.economy.items.findIndex(i => i.id === itemID)].count++;
        } else {
            // @ts-ignore
            this.economy.items.push(references.item(itemID));
        }
    }

    /**
     * Subtract coins from the user
     * @param {Number} amount - The amount of coins to subtract
     * @returns {Number} The coins of the user after subtraction 
     */
    subtractCoins(amount) {
        // @ts-ignore
        this.economy.coins = this.economy.coins - amount;
        // @ts-ignore
        return this.economy.coins;
    }

    /**
     * Add coins to the user
     * @param {Number} amount - The amount of coins to add
     * @returns {Number} The coins of the user after the coins were added 
     */
    addCoins(amount) {
        // @ts-ignore
        this.economy.coins = this.economy.coins + amount;
        // @ts-ignore
        return this.economy.coins;
    }

    /**
     * Quickly compare the current timestamp with the cooldown to see if the user is in cooldown
     * @param {String} cooldown - The name of the cooldown
     * @return {Boolean} Whether or not the user is in cooldown
     */
    isInCooldown(cooldown) {
        // @ts-ignore
        const cooldownObj = this.cooldowns[cooldown];
        if (typeof cooldownObj === 'object') {
            for (const cool of cooldownObj.cooldowns) {
                if (cool < Date.now()) {
                    return false;
                }
            }
            return cooldownObj.cooldowns.length < cooldownObj.max ? false : true;
        }
        return cooldownObj > Date.now();
    }

    /**
     * Add a cooldown to the user
     * @param {String} cooldown - The name of the cooldown
     * @param {Number} duration - The duration in milliseconds of the cooldown
     * @returns {Number} The timestamp at which the cooldown will expire
     */
    addCooldown(cooldown, duration) {
        // @ts-ignore
        const cooldownObj = this.cooldowns[cooldown];
        if (typeof cooldownObj === 'object') {
            if (cooldownObj.cooldowns.length < cooldownObj.max) {
                const newLength = cooldownObj.cooldowns.push(Date.now() + duration);
                return cooldownObj.cooldowns[newLength - 1];
            }
            let oldestCooldown = cooldownObj.cooldowns.sort((a, b) => a - b)[0];
            cooldownObj.cooldowns[cooldownObj.cooldowns.findIndex(c => c === oldestCooldown)] = Date.now() + duration;
            return oldestCooldown;
        }
        // @ts-ignore
        this.cooldowns[cooldown] = Date.now() + duration;
        // @ts-ignore
        return this.cooldowns[cooldown];
    }

    /**
     * To use on a cooldown that can have multiple cooldowns, get the first cooldown that will expire
     * @param {String} cooldown - The name of the cooldown
     * @returns {Number} The timestamp of the nearest cooldown, or undefined if all of them are expired
     */
    getNearestCooldown(cooldown) {
        // @ts-ignore
        const cooldownObj = this.cooldowns[cooldown];
        return cooldownObj.cooldowns.filter(c => c > Date.now()).sort((a, b) => a - b)[0];
    }

    /**
     * Add experience to the user
     * @param {Number} amount The amount of experience to add to the user
     * @returns {Number} The total experience of the user
     * @memberof ExtendedUserEntry
     */
    addExperience(amount) {
        // @ts-ignore
        this.experience.amount = this.experience.amount + amount;
        // @ts-ignore
        return this.experience.amount;
    }

    getLevel() {
        // @ts-ignore
        return Math.floor(Math.pow(this.experience.amount / config.options.experience.baseXP, 1 / config.options.experience.exponent));
    }

    /**
     * Check if this user has the premium status
     * @returns {Boolean} Whether this user has the premium status 
     */
    hasPremiumStatus() {
        // @ts-ignore
        if (typeof this.premium.expire === 'number') {
            // @ts-ignore
            return this.premium.expire > Date.now();
        } else {
            // @ts-ignore
            return this.premium.expire ? true : false;
        }
        
    }

    /**
     * Get the limitations of this user's tier 
     * @returns {TierLimits} The user's tier limits
     */
    get tierLimits() {
        const perks = (profileBgSize, playlistLoadLimit, playlistSaveLimit, maxSavedPlaylists) => { return { profileBgSize, playlistLoadLimit, playlistSaveLimit, maxSavedPlaylists }; };
        switch (this.premium.tier) {
        case 0:
            return perks(1e6, 100, 100, 3);
            break;
        case 1:
            return perks(2e6, 200, 200, 4);
            break;
        case 2:
            return perks(4e6, 300, 400, 5);
            break;
        case 3:
            return perks(5e6, 400, 500, 8);
            break;
        case 4:
            return perks(10e6, 500, 750, 10);
            break;
        case 5:
            return perks(50e6, 600, 1000, 15);
            break;
        }
    }

    /**
     * Return this without the additional methods, essentially returns a proper database entry, ready to be saved into the database
     * Note that this shouldn't be called before saving it into the database, as the database wrapper already does it
     * @returns {UserEntry} - This, as a proper database entry object (without the additional methods)
     */
    toDatabaseEntry() {
        const cleanObject = (() => {
            const newObject = {};
            for (const key in this) {
                if (typeof this[key] !== 'function' && key !== "client") {
                    newObject[key] = this[key];
                }
            }
            return newObject;
        })();
        return cleanObject;
    }

    /**
     * Save this user entry in the database
     * @returns {Promise<UserEntry>} - The saved entry
     */
    save() {
        return this.client.handlers.DatabaseWrapper.set(this, 'users');
    }
}

module.exports = ExtendedUserEntry;