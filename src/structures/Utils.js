/** @typedef {import("../Cluster")} Client */

module.exports = class Utils {
    /**
     * Creates an instance of Utils.
     * @param {Client} client The client instance
     */
    constructor(client) {
        this.client = client;
    }

    /**
   * Performs a deep merge of the two given object, the behavior of this merge being the same as RethinkDB's `update`/`merge` methods
   * @param {Object} target - The object that should be updated with the source
   * @param {Object} source - The object that will be merged on the `target` object
   * @returns {Object} The merged object
   */
    deepMerge (target, source) {
        let destination = {};
        for (const key of Object.keys(target)) {
            destination[key] = (typeof target[key] === 'object' && !Array.isArray(target[key])) ? { ...target[key] } : target[key];
        }

        for (const key of Object.keys(source)) {
            if (!target[key] || typeof target[key] !== 'object' || Array.isArray(source[key])) {
                destination[key] = source[key];
            } else {
                if (typeof source[key] !== 'object') {
                    destination[key] = source[key];
                } else {
                    destination[key] = this.deepMerge(target[key], source[key]);
                }
            }
        }
        return destination;
    }
};