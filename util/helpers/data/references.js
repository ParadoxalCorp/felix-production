'use strict';

//Not sure why i would make that a class but ok

/**
 * @typedef {object} Permissions
 * @property {Array<String>} allowedCommands commands which can be used on guilds
 * @property {Array<String>} restrictedCommands commands which can't be used on guild
 * @property {String} [id] The ID of the target these permissions apply to, this key will be missing if these permissions are global
*/

/**
 * @typedef {Object} TransactionData
 * @property {Number} amount The change in the user's holy coins amount
 * @property {String} from Username#Discriminator of the user from who the coins once belonged
 * @property {String} to Username#Discriminator of who received the coins
 * @property {String} reason The reason of the transfer
 * @property {Number} date The UNIX timestamp of when the transfer happened 
 */

 /**
 * @typedef {Object} ExperienceNotifications
 * @property {String} channel The ID of the channel where to send the level-up notifications, or "dm" if set to dms
 * @property {String} message A custom level-up message, empty if none is set
 * @property {Boolean} enabled Whether level-up notifications are enabled
 */

 /**
 * @typedef {Object} ActivityGuildRole
 * @property {String} id The ID of the role set to be given at some activity threshold  
 * @property {Boolean} static Whether the role should stay when the member wins a higher one
 * @property {Number} at The level at which the role is set to be given
 */

/**
 * @typedef {Object} GuildMember
 * @property {String} id The ID of the guild member 
 * @property {Number} experience The amount of experience this member has
 */

/**
 * @typedef {Object} GreetingsAndFarewells This object represent both the greetings and farewells settings as they have the same structure, note that they are still independent
 * @property {Boolean} enabled Whether the greetings/farewells are enabled on this guild
 * @property {String} message The custom greetings/farewells message set on this guild, empty if none is set
 * @property {String} channel The ID of the channel where to send the greetings/farewells message, if greetings, can also be "dm". Empty if none is set
 */

 /**
 * @typedef {Object} SelfAssignableRole This object represent both the greetings and farewells settings as they have the same structure, note that they are still independent
 * @property {String} id The ID of the self-assignable role
 * @property {Array<String>} incompatibleRoles An array of roles with which this role is incompatible
 */

 /**
 * @typedef {Object} GuildEntry  
 * @property {String} id The ID of the guild
 * @property {String} prefix The prefix of the guild, empty if none is set
 * @property {Boolean} spacedPrefix Whether the prefix contains a space 
 * @property {Number|Boolean} premium Whether this guild has the premium status, if a number, it is the UNIX timestamp when the premium status will expire. `true` in case of a monthly pledge
 * @property {Array<selfAssignableRole>} selfAssignableRoles An array of self-assignable roles set on this guild
 * @property {Array<String>} onJoinRoles An array of IDs corresponding to the roles set to be given to new members on this guild
 * @property {{users: Permissions, roles: Permissions, channel: Permissions, categories: Permissions, global: Permissions}} permissions An object representing all the permissions set on this guild
 * @property {{members: Array<GuildMember>, roles: Array<ActivityGuildRole>, enabled: Boolean, notifications: ExperienceNotifications}} experience An object representing the settings for the activity system on this guild
 * @property {GreetingsAndFarewells} greetings The greetings settings
 * @property {GreetingsAndFarewells} farewells The farewells settings
 */

 /**
 * @typedef {Object} OwnedItem 
 * @property {Number} count The amount of copy of this item the user has
 * @property {Number} id The ID of the item
 */

 /**
 * @typedef {Object} UserEconomy 
 * @property {Number} coins The amount of holy coins this user has
 * @property {Array<TransactionData>} transactions The custom greetings/farewells message set on this guild, empty if none is set
 * @property {Array<OwnedItem>} items An array of items this user own
 */

/**
 * @typedef {Object} UserLove 
 * @property {Number} amount The amount of love points this user has been given
 */

 /**
 * @typedef {Object} UserPlaylist
 * @property {String} name The name of the playlist
 * @property {String} id The id of the playlist
 * @property {Array<import("../modules/musicConnection.js").PartialLavalinkTrack>} tracks An array of partial lavalink tracks
 */

  /**
 * @typedef {Object} UserPlaylists
 * @property {String} id The id of the user
 * @property {Array} playlists An array that should contain the playlists
 */

 /**
 * @typedef {Object} UserExperience
 * @property {Number} amount The amount of experience this user has gained
 */

 /**
 * @typedef {Object} Cooldown
 * @property {Number} max The maximum amount of cooldowns that can be stacked
 * @property {Array<Number>} cooldowns An array of UNIX timestamps representing when each cooldown expire
 */

/**
 * @typedef {Object} UserCooldowns
 * @property {Number} dailyCooldown A UNIX timestamp representing when the daily cooldown expires
 * @property {Cooldown} loveCooldown An object representing when each love cooldown expire
 */

/**
 * @typedef {Object} PremiumStatus
 * @property {Number} tier The patreon tier this user is in
 * @property {Number|Boolean} expire If a number, the UNIX timestamp when the user's premium status expires. If "true", that means the user pledges monthly so there is no determined date of when their premium ends
 */

 /**
 * @typedef {Object} TierLimits
 * @property {Number} profileBgSize The maximum size of the background set for the rank command
 * @property {Number} playlistLoadLimit The maximum size of a playlist that can be loaded at once
 * @property {Number} playlistSaveLimit The maximum size of a playlist that can be saved
 * @property {Number} maxSavedPlaylists The maximum count of playlists that can be saved
 */

/**
 * @typedef {Object} UserEntry  
 * @property {String} id The ID of the user
 * @property {Boolean} blacklisted Whether the user is blacklisted from the bot
 * @property {PremiumStatus} premium An object representing the premium status of the user
 * @property {UserEconomy} economy An object that represent the economic state of the user
 * @property {UserLove} love Whether this guild has the premium status, if a number, it is the UNIX timestamp when the premium status will expire. `true` in case of a monthly pledge
 * @property {UserExperience} experience An array of self-assignable roles set on this guild
 * @property {UserCooldowns} cooldowns An array of IDs corresponding to the roles set to be given to new members on this guild
 */

/**
 * This class provides all the default data model the process may use, for example, the default data models for guild and user entries in the database
 * @class References
 * @typedef {References} References 
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
     * @param {String} id The ID of the guild
     * @returns {GuildEntry} A guild entry
     */
    guildEntry(id) {
        return {
            id: id,
            prefix: "",
            spacedPrefix: true,
            selfAssignableRoles: [],
            onJoinRoles: [],
            permissions: {
                users: [],
                roles: [],
                channels: [],
                categories: [],
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
     * @param {String} id - The ID of the role
     * @param {Array<String>} [incompatibleRoles=[]] - An array of roles ID with which this role is incompatible
     * @returns {SelfAssignableRole} Role ID and incompatibleRoles array */
     selfAssignableRole(id, incompatibleRoles) {
        return {
            id,
            incompatibleRoles: incompatibleRoles || []
       };
     }

    /**
     * Entry for guildEntry.experience.members
     * Store experience-system related data
     * @param {String} id - The ID of the member
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
     * @param {String} id - The ID of the target
     * @returns {Permissions} The permission set for this target
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
     * @param {String} id - The ID of the role
     * @param {Number} at - The level at which this role should be given
     * @param {Boolean} isStatic - Whether this role should be removed when a higher one is won, if false, the role will be removed
     * @return {ActivityGuildRole} The role object
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
     * @param {String} id The ID of the user
     * @returns {object} A user entry
     */
    userEntry(id) {
        return {
            id: id,
            blacklisted: false,
            premium: {
                tier: 0,
                expire: false
            },
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
     * @param {Number} data.amount The amount of coins that has been debited/credited(negative if debited, positive if credited)
     * @param {String} data.from  Username#Discriminator of the user from who the coins once belonged
     * @param {String} data.to Username#Discriminator of who received the coins
     * @param {String} data.reason The reason of the transfer (automatic, intended..)
     * @return {TransactionData} The transaction data object
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
     * @returns {{id: Number, count: Number}} The item database entry
     */
    item(item) {
        return {
            id: item.id,
            count: 1
        };
    }

    /**
     * Data model of a user playlists 
     * @param {String} id - The ID of the user
     * @returns {UserPlaylists} The UserPlaylists data model
     */
    userPlaylists(id) {
        return {
            id,
            playlists: []
        };
    }

    /**
     * Data model of a user playlist
     * @param {String} name - The name of the playlist
     * @param {String} id - The ID of the playlist
     * @param {Array<import("../modules/musicConnection.js").LavalinkTrack>} tracks - An array of tracks
     * @returns {UserPlaylist} 
     */

    userPlaylist(name, id, tracks) {
        return {
            name,
            id,
            tracks: tracks.map(t => {
                return {
                    track: t.track,
                    info: {
                        author: t.info.author,
                        length: t.info.length,
                        title: t.info.title,
                        uri: t.info.uri
                    }
                };
            })
        };
    }

}

module.exports = new References();
