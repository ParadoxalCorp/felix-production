'use strict';

const references = require('../data/references');
const config = require('../../../config');

class ExtendedUserEntry {
    constructor(userEntry) {
        Object.assign(this, userEntry);
    }

    /**
     * Check if a user has the specified item
     * @param {number} itemID - The ID of the item 
     * @returns {boolean} Whether or not the user has the specified item
     */
    hasItem(itemID) {
        // @ts-ignore
        return this.economy.items.find(i => i.id === itemID) ? true : false;
    }

    /**
     * Add an item to the user entry, handle already owned items cases (increment the count). This modifies the object
     * @param {number} itemID - The ID of the item to add
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
     * @param {number} amount - The amount of coins to subtract
     * @returns {number} The coins of the user after subtraction 
     */
    subtractCoins(amount) {
        // @ts-ignore
        this.economy.coins = this.economy.coins - amount;
        // @ts-ignore
        return this.economy.coins;
    }

    /**
     * Add coins to the user
     * @param {number} amount - The amount of coins to add
     * @returns {number} The coins of the user after the coins were added 
     */
    addCoins(amount) {
        // @ts-ignore
        this.economy.coins = this.economy.coins + amount;
        // @ts-ignore
        return this.economy.coins;
    }

    /**
     * Quickly compare the current timestamp with the cooldown to see if the user is in cooldown
     * @param {string} cooldown - The name of the cooldown
     * @return {boolean} Whether or not the user is in cooldown
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
     * @param {string} cooldown - The name of the cooldown
     * @param {number} duration - The duration in milliseconds of the cooldown
     * @returns {number} The timestamp at which the cooldown will expire
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
     * @param {string} cooldown - The name of the cooldown
     * @returns {number} The timestamp of the nearest cooldown, or undefined if all of them are expired
     */
    getNearestCooldown(cooldown) {
        // @ts-ignore
        const cooldownObj = this.cooldowns[cooldown];
        return cooldownObj.cooldowns.filter(c => c > Date.now()).sort((a, b) => a - b)[0];
    }

    /**
     * Add experience to the user
     * @param {number} amount The amount of experience to add to the user
     * @returns {number} The total experience of the user
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
     * @returns {boolean} Whether this user has the premium status 
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

    //eslint-disable-next-line valid-jsdoc
    /**
     * Get the limitations of this user's tier 
     * @returns {import("../data/references.js").TierLimits} The user's tier limits
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
                return perks(4e6, 400, 400, 5);
                break;
            case 3:
                return perks(10e6, 500, 500, 8);
                break;
            case 4:
                return perks(50e6, 600, 1000, 10);
                break;
        }
    }

    /**
     * Return this without the additional methods, essentially returns a proper database entry, ready to be saved into the database
     * Note that this shouldn't be called before saving it into the database, as the database wrapper already does it
     * @returns {*} - This, as a proper database entry object (without the additional methods)
     */
    toDatabaseEntry() {
        const cleanObject = (() => {
            const newObject = {};
            for (const key in this) {
                if (typeof this[key] !== 'function') {
                    newObject[key] = this[key];
                }
            }
            return newObject;
        })();
        return cleanObject;
    }
}

module.exports = ExtendedUserEntry;