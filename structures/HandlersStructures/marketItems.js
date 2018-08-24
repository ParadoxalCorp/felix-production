/** @typedef {import("../../main.js")} Client 
 * @typedef {import("../../handlers/economyManager.js")} EconomyManager 
 * @typedef {import("../ExtendedStructures/extendedUserEntry.js")} UserEntry 
 * @typedef {import("../ExtendedStructures/extendedGuildEntry.js").GuildEntry} GuildEntry
 * @typedef {import("../Contexts/BaseContext")} BaseContext
 */
 
/** @typedef {Object} ShipData
 * @prop {String} type The type of the ship, can be `Destroyer` or `Battleship` at the moment
 * @prop {Boolean} flagship Whether the ship can be a flagship
 */

/** @typedef {Object} MarketItem
 * @prop {Number} id The ID of the item
 * @prop {String} name The name of the item
 * @prop {String} description The description of the item
 * @prop {Boolean} buyableOnce Whether this item can only be bought once 
 * @prop {String} family The family, or category, of this item
 * @prop {Number|Function<BaseContext>} price The price of the item, if a function, it should be called like `.price(<Context>)` with an instance of the context
 * @prop {String} emote The corresponding emote for this item
 * @prop {String} [image] The URL to a fitting image, if any
 * @prop {Function<BaseContext>} [run] If the item has just been purchased and this function exist, this should be ran like `.run(<Context>)` with an instance of the context
 * @prop {ShipData} [data] If a ship, the corresponding data
 */


const marketItems = [{
    id: 1000,
    name: 'dog',
    description: 'A dog, the legend says that dogs are relatively effective against cats',
    buyableOnce: true,
    family: 'Animals',
    price: 50000,
    emote: ':dog:'
}, {
    id: 2000,
    name: 'Asakaze',
    description: 'Completed the 16 June 1923, the Asakaze was a IJN Minekaze-class destroyer. She featured 4 Type 3 120 mm 45 caliber naval guns and 3x2 530mm torpedo tubes.\n\nShips can come in handy for a number of tasks, for example dealing with pirates',
    buyableOnce: true,
    family: 'Ships',
    data: {
        type: 'Destroyer',
        flagship: false
    },
    price: 1e6,
    emote: ':ship:',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Japanese_destroyer_Asakaze_around_1924.jpg/300px-Japanese_destroyer_Asakaze_around_1924.jpg'
}, {
    id: 2001,
    name: 'Hiei',
    description: 'The Hiei, first commissioned the 4 August 1914, was a IJN Kongō-class fast-battleship. After her 1935 refit, she featured 4x2 356mm main battery turrets and a relatively strong armor.\n\nShips can come in handy for a number of tasks, for example dealing with pirates',
    buyableOnce: true,
    family: 'Ships',
    data: {
        type: 'Battleship',
        flagship: false
    },
    price: 2e6,
    emote: ':ship:',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Japanese_Battleship_Hiei.jpg/220px-Japanese_Battleship_Hiei.jpg'
}, {
    id: 2002,
    name: 'Yuudachi',
    description: 'Poi, i mean, Yūdachi, nowadays more commonly known as Yuudachi, was a IJN Shiratsuyu-class destroyer. Commissioned the 7 January 1937, She was part of the mightiest destroyers of her time, featuring a set of 2x4 610mm torpedo tubes. As of now, Yuudachi is also a Discord bot available [here](https://bots.discord.pw/bots/388799526103941121) that you should check out (totally not advertising hello yes)\n\nShips can come in handy for a number of tasks, for example dealing with pirates',
    buyableOnce: true,
    family: 'Ships',
    data: {
        type: 'Destroyer',
        flagship: false
    },
    price: 1e6,
    emote: ':ship:',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Yudachi_II.jpg/300px-Yudachi_II.jpg'
}, {
    id: 3000,
    name: 'Love point',
    description: 'Gives an extra love point to use',
    buyableOnce: false,
    family: 'Perks',
    price: (context) => 1e7 * context.userEntry.cooldowns.loveCooldown.max,
    emote: ':heart:',    
    // @ts-ignore
    run: (context) => context.userEntry.cooldowns.loveCooldown.max++
}];

module.exports = marketItems;