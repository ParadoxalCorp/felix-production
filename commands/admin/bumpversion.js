'use strict';
//@ts-check

const Command = require('../../structures/Command');
const axios = require('axios').default;

class BumpVersion extends Command {
    constructor() {
        super();
        this.help = {
            name: 'bumpversion',
            category: 'admin',
            description: 'Bump Felix\'s version and create a new release on Sentry',
            usage: '{prefix}bumpversion <major|minor|patch|x.x.x> | <commit_id>'
        };
        this.conf = {
            requireDB: false,
            disabled: false,
            aliases: ["bump"],
            requirePerms: [],
            guildOnly: false,
            ownerOnly: false,
            expectedArgs: []
        };
    }

    // eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
        if (!args[0]) {
            return message.channel.createMessage(':x: You must specify if its a major, minor or patch bump, or at least the specific version');
        }
        let newRelease = args[0];
        if (['major', 'minor', 'patch'].includes(args[0])) {
            const versions = client.package.version.split('.');
            switch (args[0]) {
                case 'major':
                    versions[0] = `${parseInt(versions[0]) + 1}`;
                    break;
                case 'minor':
                    versions[1] = `${parseInt(versions[1]) + 1}`;
                    break;
                case 'patch':
                    versions[2] = `${parseInt(versions[2]) + 1}`;
                    break;
            }
            newRelease = versions.join('.');
        }
        client.package.version = newRelease;
        if (client.config.apiKeys.sentryAPI && args[1]) {
            await this.postRelease(client, args[1]);
        } 
        return message.channel.createMessage(`:white_check_mark: Successfully bumped the version to \`${client.package.version}\``);
    }

    async postRelease(client, commitID) {
        return axios.post('https://app.getsentry.com/api/0/organizations/paradoxcorp/releases/', {
            version: client.package.version,
            ref: commitID,
            projects: ['felix'],
            url: `https://github.com/ParadoxalCorp/felix-production/tree/v${client.package.version}`,
            commits: [{id: commitID, repository: 'ParadoxalCorp/felix-production'}]
        }, {
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${client.config.apiKeys.sentryAPI}`}
        });
    }
}

module.exports = new BumpVersion();