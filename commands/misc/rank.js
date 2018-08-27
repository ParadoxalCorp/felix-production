//Written by Ota#1354 the 26/06/2018

const axios = require("axios");
const MiscCommands = require('../../structures/CommandCategories/MiscCommands');
const databaseUpdater = require('../../utils/databaseUpdater');

class Rank extends MiscCommands {
    constructor(client) {
        super(client, {
            help: {
                name: 'rank',
                description: 'Display your local and global experience details',
                usage: '{prefix}rank',
            },
            conf: {
                guildOnly: true,
                requireDB: true,
                requirePerms: ['attachFiles'],
                aliases: ["sys", "info", "stats"],
                require: ['fs-nextra', 'canvas-constructor', 'canvas']
            }
        });
    }
    /** @param {import("../../structures/Contexts/MiscContext")} context */

    async run(context) {
        const { Canvas } = require('canvas-constructor');
        const fsn = require('fs-nextra');
        const rethink = context.client.handlers.DatabaseWrapper.rethink;
      
        const user = await this.getUserFromText({ message: context.message, client: context.client, text: context.args.join(' ') });
        const target = user || context.message.author;
        const targetEntry = target.id !== context.message.author.id ? await context.client.handlers.DatabaseWrapper.getUser(target.id) : context.userEntry;
        const localLevelDetails = context.client.handlers.ExperienceHandler.getLevelDetails(context.guildEntry.getLevelOf(target.id));
        const globalLevelDetails = context.client.handlers.ExperienceHandler.getLevelDetails(targetEntry.getLevel());
        const userExp = context.guildEntry.experience.members.find(u => u.id === target.id) ? context.guildEntry.experience.members.find(u => u.id === target.id).experience : 0;
        const member = context.message.channel.guild.members.get(target.id);
        const leaderboardG = await this.getLeaderboard('experience', target);
        const leaderboardL = context.guildEntry.experience.members.sort((a, b) => b.experience - a.experience);
        //Shortcut to the resource folder imgs
        let resources = './resources/imgs/';
        //Length progress bars
        let progressBar = 131;
        //Police custom
        Canvas.registerFont(`.../../resources/polices/Digitalt.ttf`, {
            family: 'rank' // Police family
        });
        //Declaration of Canvas and creating a template (Length 300 and Width 300)
        // @ts-ignore
        const background = await context.client.handlers.DatabaseWrapper.rethink.table("user_profiles").get(target.id).run().then(data => data ? Buffer.from(data.image, 'base64') : false) || await fsn.readFile(`${resources}back0.jpg`);  
        const GetRank = new Canvas(300, 300)
            //Background (Changeable in the future logically)
            .addImage(background, 0, 0, 300, 300) //We will look for the image "Background" in the folder "imgs" (x=0, y=0, Length=300, Width=300)
            //Layer one
            .addImage(await fsn.readFile(`${resources}card-back0.png`), 0, 0, 300, 300) //We will look for the image "Layer" in the folder "imgs" (x=0, y=0, Length=300, Width=300)
            //Select color White for the circle
            .setColor('#ffffff') //Hex Color (#ffffff = White)
            //Circle White (The one behind the avatar)
            .addCircle(150, 73, 59) //Creating circle White (x=150, y=73, radius=59)
            //Select color progress bars blue
            .setColor('#8DA0E1') //Hex Color (#8DA0E1 = Blue Discord)
            //Picture progress bar Global
            .addRect(
                13,
                197,
                Math.round(progressBar*((targetEntry.experience.amount - globalLevelDetails.thisLevelExp)/(globalLevelDetails.nextLevelExp - globalLevelDetails.thisLevelExp))),
                17
            ) //Creating picture progress bar Global (x=13, y=197, Length=XP current, Width=17)
            //Picture progress bar Local
            .addRect(
                156,
                197,
                Math.round(progressBar*((userExp - localLevelDetails.thisLevelExp)/(localLevelDetails.nextLevelExp - localLevelDetails.thisLevelExp))),
                17
            ) //Creating picture progress bar Local (x=156, y=197, Length=XP current, Width=17)
            //Push avatar user
            .addImage(await axios.default.get(member.avatarURL, {
                responseType: 'arraybuffer'
            }).then((res) =>
                res.data
            ), 96, 19, 108, 108, {
                type: 'round',
                radius: 54
            }) //Get avatar user via axios (x=96, y=19, Length=108, Width=108, type=round, radius=54(To have the radius of an image without taking the head one deviates its size by two))
            .restore()
            //Username
            .setColor('#ffffff')
            .setTextAlign('center')
            .setTextFont('20px rank')
            .addResponsiveText(`${member.username.substring(0,24)}`, 150, 160, 282, 282)
            //Value rank
            .setColor('#8DA0E1')
            .setTextAlign('center')
            .addResponsiveText(leaderboardG.userIndex + 1 ? `#${leaderboardG.userIndex + 1}` : '#?', 93, 188, 70, 300)
            .addResponsiveText(leaderboardL.findIndex(element => element.id === member.id) + 1 ? `#${leaderboardL.findIndex(element => element.id === member.id) + 1}` : '#?', 240, 188, 70, 300)
            //Text Global and local
            .setColor('#6E6E6E')
            .setTextAlign('center')
            .setTextFont('18px rank')
            .addText(`Global`, 35, 188, 300, 300)
            .addText(`Local`, 174, 188, 300, 300)
            //Text XP bars
            .addResponsiveText(`${(targetEntry.experience.amount - globalLevelDetails.thisLevelExp)}/${(globalLevelDetails.nextLevelExp - globalLevelDetails.thisLevelExp)}`, 77, 211, 129, 129)
            .addResponsiveText(`${(userExp - localLevelDetails.thisLevelExp)}/${(localLevelDetails.nextLevelExp - localLevelDetails.thisLevelExp)}`, 225, 211, 129, 129)
            //Text Global
            .setTextFont('15px rank')
            .addText(`Level :`, 35, 231, 300, 300)
            .addText(`XP     :`, 35, 252, 300, 300)
            .addText(`Level progress`, 77, 272, 300, 300)
            //Text Local
            .addText(`Level :`, 178, 231, 300, 300)
            .addText(`XP     :`, 178, 252, 300, 300)
            .addText(`Level progress`, 221, 272, 300, 300)
            //Value Global
            .setColor('#8DA0E1')
            .addResponsiveText(globalLevelDetails.level, 95, 231, 84, 300)
            .addResponsiveText(targetEntry.experience.amount, 95, 252, 84, 300)
            .addResponsiveText(`${(((targetEntry.experience.amount - globalLevelDetails.thisLevelExp)/(globalLevelDetails.nextLevelExp - globalLevelDetails.thisLevelExp))*100).toFixed(2)}%`, 77, 289, 135, 135)
            //Value Local
            .addResponsiveText(localLevelDetails.level, 238, 231, 84, 300)
            .addResponsiveText(userExp, 238, 252, 84, 300)
            .addResponsiveText(`${(((userExp - localLevelDetails.thisLevelExp)/(localLevelDetails.nextLevelExp - localLevelDetails.thisLevelExp))*100).toFixed(2)}%`, 221, 289, 135, 135)
            .toBuffer();
        return context.message.channel.createMessage(``, {
            file: GetRank,
            name: `${Date.now()}-${context.message.author.id}.png`
        });
    }
}

module.exports = Rank;
