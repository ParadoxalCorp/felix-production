const references = require('../structures/References');

const databaseUpdater = (data, type, source) => {
    const defaultDataModel = source ? source : (type === "guild" ? references.guildEntry(data.id) : references.userEntry(data.id));
    for (const key in data) {
        if (typeof defaultDataModel[key] === typeof data[key] && typeof defaultDataModel[key] === "object" && !Array.isArray(defaultDataModel[key])) {
            databaseUpdater(data[key], null, defaultDataModel[key]);
        } else if (typeof defaultDataModel[key] !== "undefined") {
            defaultDataModel[key] = data[key];
        }
    }
    return defaultDataModel;
};

module.exports = databaseUpdater;