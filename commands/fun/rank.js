'use strict';
//@ts-check

//Written by Ota#1354 the 26/06/2018

const axios = require("axios");
const Command = require('../../util/helpers/modules/Command');

class Rank extends Command {
    constructor() {
        super();
        this.help = {
            name: 'rank',
            category: 'fun',
            description: 'Display your local and global experience details',
            usage: '{prefix}rank'
        };
        this.conf = {
            requireDB: true,
            disabled: false,
            aliases: [],
            requirePerms: ['attachFiles'],
            guildOnly: true,
            ownerOnly: false,
            expectedArgs: [],
            require: ['fs-nextra', 'canvas-constructor', 'canvas']
        };
    }
    // eslint-disable-next-line no-unused-vars
    async run(client, message, args, guildEntry, userEntry) {
      const { Canvas } = require('canvas-constructor');
      const fsn = require('fs-nextra');
      
      const user = await this.getUserFromText({ message, client, text: args.join(' ') });
      const target = user ? client.extendedUser(user) : client.extendedUser(message.author);
      const targetEntry = target.id !== message.author.id ? await client.database.getUser(target.id) : userEntry;
      const localLevelDetails = client.getLevelDetails(guildEntry.getLevelOf(target.id));
      const globalLevelDetails = client.getLevelDetails(targetEntry.getLevel());
      const userExp = guildEntry.experience.members.find(u => u.id === target.id) ? guildEntry.experience.members.find(u => u.id === target.id).experience : 0;
      const member = message.channel.guild.members.get(target.id);
      let leaderboardG = client.database.users.map(u => u);
      leaderboardG = leaderboardG.map(e => client.database._updateDataModel(e, 'user')).sort((a, b) => b.experience.amount - a.experience.amount).map(u => {
          u.levelDetails = client.getLevelDetails(new client.extendedUserEntry(u).getLevel());
          return u;
      });
      let leaderboardL = guildEntry.experience.members;
      leaderboardL = leaderboardL.map(e => client.database._updateDataModel(e, 'guild')).sort((a, b) => b.experience - a.experience).map(m => {
          m.levelDetails = client.getLevelDetails(guildEntry.getLevelOf(m.id));
          return m;
      });
      //Shortcut to the resource folder imgs
      let resources = './resources/imgs/';
      //Length progress bars
      let progressBar = 131;
      //Police custom
      Canvas.registerFont(`.../../resources/polices/Digitalt.ttf`, {
        family: 'rank' // Police family
      });
      //Declaration of Canvas and creating a template (Length 300 and Width 300)
      const GetRank = new Canvas(300, 300)
      //Background (Changeable in the future logically)
      .addImage(await fsn.readFile(`${resources}back0.jpg`), 0, 0, 300, 300) //We will look for the image "Background" in the folder "imgs" (x=0, y=0, Length=300, Width=300)
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
      .addImage(await axios.get(member.avatarURL, {
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
      .addResponsiveText(`#${leaderboardG.findIndex(element => element.id === member.id) + 1}`, 93, 188, 70, 300)
      .addResponsiveText(`#${leaderboardL.findIndex(element => element.id === member.id) + 1}`, 240, 188, 70, 300)
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
      return message.channel.createMessage(``, {
          file: GetRank,
          name: `${Date.now()}-${message.author.id}.png`
      });
   }
}

module.exports = new Rank();
