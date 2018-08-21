const axios = require('axios').default;
const AdminCommands = require('../../structures/CommandCategories/AdminCommands');

class BumpVersion extends AdminCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'bumpversion',
                description: 'Bump Felix\'s version and create a new release on Sentry',
                usage: '{prefix}bumpversion <major|minor|patch|x.x.x> | <commit_id>'
            },
            conf: {
                aliases: ["bump"],
            }
        });
    }
    /** @param {import("../../structures/Contexts/AdminContext")} context */

    async run(context) {
        if (!context.args[0]) {
            return context.message.channel.createMessage(':x: You must specify if its a major, minor or patch bump, or at least the specific version');
        }
        let newRelease = context.args[0];
        if (['major', 'minor', 'patch'].includes(context.args[0])) {
            const versions = context.client.package.version.split('.');
            switch (context.args[0]) {
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
        context.client.package.version = newRelease;
        if (context.client.config.apiKeys.sentryAPI && context.args[1]) {
            await this.postRelease(context.args[1]);
        } 
        return context.message.channel.createMessage(`:white_check_mark: Successfully bumped the version to \`${context.client.package.version}\``);
    }

    async postRelease(commitID) {
        return axios.post('https://app.getsentry.com/api/0/organizations/paradoxcorp/releases/', {
            version: this.client.package.version,
            ref: commitID,
            projects: ['felix'],
            url: `https://github.com/ParadoxalCorp/felix-production/tree/v${this.client.package.version}`,
            commits: [{id: commitID, repository: 'ParadoxalCorp/felix-production'}]
        }, {
            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${this.client.config.apiKeys.sentryAPI}`}
        });
    }
}

module.exports = BumpVersion;