/**
 * @typedef {object} Permissions
 * @property {Array<String>} allowedCommands commands which can be used on guilds
 * @property {Array<String>} restrictedCommands commands which can't be used on guild
 * @property {String} [id] The ID of the target these permissions apply to, this key will be missing if these permissions are global
*/

module.exports = class Models {
    /**
     * The default permissions
     * @returns {Permissions}
     * @readonly
     */
    static get defaultPermissions() {
        return {
            allowedCommands: ['generic*', 'fun*', 'misc*', 'utility*', 'image*'],
            restrictedCommands: ['settings*']
        }
    }

    /**
     * The set for global permissions
     * @returns {Permissions}
     * @readonly
     */
    static get globalPermissionsSet() {
        return {
            allowedCommands: [],
            restrictedCommands: []
        }
    }

    /**
     * Permission set for a channel/role/user
     * @param {String} id - The ID of the target
     * @returns {Permissions} The permission set for this target
     */
    static permissionsSet(id) {
        return {
            allowedCommands: [],
            restrictedCommands: [],
            id: id
        };
    }
}