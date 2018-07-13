'use strict';

//Not sure why i would make that a class but ok

/**
 * @typedef {object} Permissions
 * @property {Array<String>} allowedCommands commands which can be used on guilds
 * @property {Array<String>} restrictedCommands commands which can't be used on guild
 * 
*/

/**
 * @typedef {Object} TransactionObject
 * @property {number} amount
 * @property {string} from
 * @property {string} to
 * @property {string} reason
 * @property {number} date
 */

/**
 * This class provides all the default data model the process may use, for example, the default data models for guild and user entries in the database
 * @class References
 */
class References {
    constructor() {
        /** @type {Permissions} The default permissions object */
        this.defaultPermissions = {
            allowedCommands: ['generic*', 'fun*', 'economy*', 'misc*', 'utility*', 'image*', 'music*'],
            restrictedCommands: ['settings*', 'forceskip']
        };
        /** @type {Permissions} The default permissions object, but with empty arrays */
        this.globalPermissionsSet = {
            allowedCommands: [],
            restrictedCommands: []
        };
    }

    /**
     * Returns the default guild entry structure used in the database
     * @param {string} id The ID of the guild
     * @returns {object} A guild entry
     */
    guildEntry(id) {
        return {
            id: id,
            prefix: "",
            spacedPrefix: true,
            premium: '',
            selfAssignableRoles: [],
            onJoinRoles: [],
            permissions: {
                users: [],
                roles: [],
                channels: [],
                global: this.globalPermissionsSet
            },
            experience: {
                members: [],
                roles: [],
                enabled: false,
                notifications: {
                    channel: '',
                    message: '',
                    enabled: true
                }
            },
            greetings: {
                enabled: false,
                message: '',
                channel: ''
            },
            farewells: {
                enabled: false,
                message: '',
                channel: ''
            }
        };
    }

    /**
     * Returns the configuration of an auto assignable role
     * @param {string} id - The ID of the role
     * @param {Array<String>} [incompatibleRoles=[]] - An array of roles ID with which this role is incompatible
     * @returns {{id : string, incompatibleRoles : Array<String>}} Role ID and incompatibleRoles array     */
     selfAssignableRole(id, incompatibleRoles) {
       return {
         id,
         incompatibleRoles: incompatibleRoles || []
       };
     }

    /**
     * Entry for guildEntry.experience.members
     * Store experience-system related data
     * @param {string} id - The ID of the member
     * @returns {{id : String, experience: Number}} The object
     */
    guildMember(id) {
        return {
            id: id,
            experience: 0
        };
    }

    /**
     * Permission set for a channel/role/user
     * @param {string} id - The ID of the target
     * @returns {{allowedCommands : Array<String>, restrictedCommands: Array<String>, id: String}} The permission set for this target
     */
    permissionsSet(id) {
        return {
            allowedCommands: [],
            restrictedCommands: [],
            id: id
        };
    }

    /**
     *
     * @param {string} id - The ID of the role
     * @param {number} at - The level at which this role should be given
     * @param {Boolean} isStatic - Whether this role should be removed when a higher one is won, if false, the role will be removed
     * @return {{id: String, static: Boolean, at : Number}} The role object
     */
    activityGuildRole(id, at, isStatic = true) {
        return {
            id: id,
            static: isStatic,
            at: at
        };
    }

    /**
     * Returns the default user entry structure used in the database
     * @param {string} id The ID of the user
     * @returns {object} A user entry
     */
    userEntry(id) {
        return {
            id: id,
            blacklisted: false,
            economy: {
                coins: 500,
                transactions: [],
                items: []
            },
            love: {
                amount: 0
            },
            experience: {
                amount: 0
            },
            cooldowns: {
                dailyCooldown: 0,
                loveCooldown: {
                    max: 2,
                    cooldowns: []
                }
            }
        };
    }

    /**
     *
     * @param {object} data An object of data
     * @param {number} data.amount The amount of coins that has been debited/credited(negative if debited, positive if credited)
     * @param {string} data.from  Username#Discriminator of the user from who the coins once belonged
     * @param {string} data.to Username#Discriminator of who received the coins
     * @param {string} data.reason The reason of the transfer (automatic, intended..)
     * @return {TransactionObject} The transaction data object
     */
    transactionData(data) {
        return {
            amount: data.amount,
            from: data.from,
            to: data.to,
            reason: data.reason,
            date: Date.now()
        };
    }

    /**
     *
     * @param {object} item - The item
     * @returns {{id: number, count: number}} The item database entry
     */
    item(item) {
        return {
            id: item.id,
            count: 1
        };
    }

}

module.exports = new References();
