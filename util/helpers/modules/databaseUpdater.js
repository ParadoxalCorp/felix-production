'use strict';

const references = require('../data/references');

const databaseUpdater = (data, type) => {
    const defaultDataModel = type === "guild" ? references.guildEntry(data.id) : references.userEntry(data.id);
    for (const key in data) {
        if (typeof defaultDataModel[key] === typeof data[key] && typeof defaultDataModel[key] === "object" && !Array.isArray(defaultDataModel[key])) {
            this._traverseAndUpdate(defaultDataModel[key], data[key]);
        } else if (typeof defaultDataModel[key] !== "undefined") {
            defaultDataModel[key] = data[key];
        }
    }
    return defaultDataModel;
};

module.exports = databaseUpdater;