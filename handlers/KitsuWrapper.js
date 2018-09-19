/** @typedef {import("../main").Client} Client
 * @typedef {import('axios').AxiosResponse} AxiosResponse
 */

/** @typedef {Object} ImageDimensions Neither width or height is guaranteed, and are in fact usually both null
 * @prop {String} [width] The width of the image
 * @prop {String} [height] The height of the image
*/

/** @typedef {Object} ImagesDimensions
 * @prop {ImageDimensions} tiny The dimensions for the tiny image 
 * @prop {ImageDimensions} small The dimensions for the small image 
 * @prop {ImageDimensions} [medium] The dimensions for the medium image , this is only available for poster images
 * @prop {ImageDimensions} large The dimensions for the large image 
 */

/** @typedef {Object} ImageMeta
 * @prop {ImagesDimensions} dimensions The dimensions for each size (except the original)
 */

/** @typedef {Object} Image 
 * @prop {String} tiny URL to the image in tiny dimensions
 * @prop {String} small URL to the image in small dimensions
 * @prop {String} [medium] URL to the image in medium dimensions, this is only available for poster images
 * @prop {String} large URL to the image in large dimensions
 * @prop {String} original URL to the image in its original dimensions
 * @prop {ImageMeta} meta Some additional data about the image
 */

/** @typedef {Object} Titles 
 * @prop {String} en The english title
 * @prop {String} en_jp The japanese title in latin alphabet
 * @prop {String} ja_jp The japanese title
 */

/** @typedef {Object} Manga 
 * @prop {String} createdAt ISO 8601 date and time, Date of creation
 * @prop {String} updatedAt ISO 8601 date and time, Date of last modification
 * @prop {String} id The ID of the manga
 * @prop {String} link The link to the manga JSON data
 * @prop {String} slug The slug of the manga
 * @prop {String} synopsis The synopsis of the manga
 * @prop {Titles} titles The titles of this manga
 * @prop {String} canonicalTitle The canonical title
 * @prop {String} averageRating The average rating of this manga
 * @prop {Object} ratingFrequencies An object, with keys going from `2` to `20`, each key representing how many users rated this note 
 * @prop {Number} userCount The amount of users who have this manga in their list
 * @prop {Number} favoritesCount The amount of users who have this manga in their favorites
 * @prop {String} startDate The date at which this manga started publishing in YYYY-MM-DD date format
 * @prop {String} endDate The date at which this manga finished publishing in YYYY-MM-DD date format
 * @prop {Number} popularityRank The rank of this manga on the popularity leaderboard
 * @prop {Number} ratingRank The rank of this manga on the average rating leaderboard
 * @prop {String} ageRating Can be either `G` (General Audiences), `PG` (Parental Guidance Suggested), `R` (Restricted) or `R18` (Explicit)
 * @prop {String} subtype Can be either `doujin`, `manga`, `manhua`, `manhwa`, `novel`, `oel` or `oneshot`
 * @prop {String} status Can be either `ongoing`, `finished`, `to be announced`, `unreleased` or `upcoming`
 * @prop {Image} posterImage The poster image of the manga
 * @prop {Image} coverImage The cover image of the manga
 * @prop {Number} chapterCount The total amount of chapters this manga is composed of
 * @prop {Number} volumeCount The total amount of volumes this manga is composed of, may be 0 
 * @prop {String} serialization The publisher
 * @prop {String} pageLink The direct link to the manga page on Kitsu
 */

const axios = require('axios').default.create({
    headers: {'Accept': 'application/vnd.api+json'}
});

class KitsuWrapper {
    /**
     * Creates an instance of KitsuWrapper.
     * @param {Client} client The client instance given in the constructor
     * @memberof KitsuWrapper
     */
    constructor(client) {
        /** @type {Client} The client instance */
        this.client = client;
        /** @type {String} The base url of Kitsu's API */
        this.baseAPIURL = "https://kitsu.io/api/edge";
        /** @type {String} The base url of Kitsu */
        this.baseURL = "https://kitsu.io";
    }

    /**
     *
     *
     * @param {String} query The search query 
     * @param {boolean} [cacheSearch=true] Whether the search should be cached, defaults to `true`
     * @returns {Promise<Array<Manga>>} An array of resolved manga
     * @memberof KitsuWrapper
     */
    async searchManga(query, cacheSearch = true) {
        const encodedQuery = encodeURIComponent(query).toLowerCase();
        const cachedSearch = this.client.handlers.RedisManager.healthy ? await this.client.handlers.RedisManager.get(`manga-search:${encodedQuery}`) : null;
        if (cachedSearch) {
            return JSON.parse(cachedSearch);
        }
        return axios.get(`${this.baseAPIURL}/manga?filter%5Btext%5D=${encodedQuery}`)
            .then(res => {
                res = this._formatGenericKitsuResponse(res.data, this._formatManga.bind(this));
                if (cacheSearch && this.client.handlers.RedisManager.healthy) {
                    //Cache the search for 1 day
                    this.client.handlers.RedisManager.set(`manga-search:${encodedQuery}`, JSON.stringify(res), 'EX', 60 * 60 * 24)
                        .catch(() => {});
                }
                return res;
            });
    }

    /**
     *
     * @private
     * @param {AxiosResponse} response The response
     * @param {Function} [callback] A callback that will be called with the formatted `response` before returning
     * @returns {*} The response, generically formatted
     * @memberof KitsuWrapper
     */
    _formatGenericKitsuResponse(response, callback) {
        const format = (res) => {
            res = { ...res.attributes, id: res.id, link: res.links.self, type: res.type };
            return callback ? callback(res) : res;
        };

        if (Array.isArray(response.data)) {
            const formattedResponses = new Array(response.data.length);
            let i = 0;
            for (let res of response.data) {
                formattedResponses[i++] = format(res);
            }
            return formattedResponses;
        } else {
            return format(response.data);
        }
    }

    /**
     * This method is intended to be passed as a callback to `_formatGenericKitsuResponse`
     * @private
     * @param {Manga} response The response
     * @returns {Manga} The manga
     * @memberof KitsuWrapper
     */
    _formatManga(response) {
        if (response.status === "current") {
            response.status = "Ongoing";
        } else if (response.status === "tba") {
            response.status = "To be announced";
        } else {
            response.status = response.status.charAt(0).toUpperCase() + response.status.substr(1);
        }
        response.subtype = response.subtype.charAt(0).toUpperCase() + response.subtype.substr(1);
        for (const key in response) {
            if (response[key] === null || response[key] === "") {
                response[key] = "Unknown";
            }
        }
        //Bullshit undocumented possibility that titles may only contain stuff like `en_kr` (╯°□°）╯︵ ┻━┻
        if (!response.titles.en || !response.titles.en_jp || !response.titles.ja_jp) {
            response.titles.en = response.titles.en || response.canonicalTitle;
            response.titles.en_jp = response.titles.en_jp || response.canonicalTitle;
            response.titles.ja_jp = response.titles.ja_jp || response.canonicalTitle;
        }
        response.pageLink = `${this.baseURL}/manga/${response.slug}`;
        return response;
    }
}

module.exports = KitsuWrapper;