const google = require('googleapis');
const search = google.customsearch('v1');

class ImageSearcher {
    constructor(API_KEY, SEARCH_ENGINE) {
        this.apiKey = API_KEY;
        this.searchEngine = SEARCH_ENGINE;
    }

    _getImageUrlFromWebSearch(response) {
        if (response.items.length
            && response.items[0].pagemap
            && response.items[0].pagemap.cse_thumbnail
            && response.items[0].pagemap.cse_thumbnail.length
        ) {
            return response.items[0].pagemap.cse_thumbnail[0].src;
        } else {
            return null;
        }
    }

    _getImageUrlFromPictureSearch(response) {
        if (response
            && response.items
            && response.items.length
        ) {
            return response.items[0].link;
        }

        return null;
    }

    _find(query) {
        return new Promise((resolve, reject) => {
            search.cse.list({
                cx: this.searchEngine,
                auth: this.apiKey,
                num: 1,
                searchType: 'image',
                q: query
            }, (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this._getImageUrlFromPictureSearch(response));
                }
            });
        });
    }

    find(query) {
        if (Array.isArray(query)) {
            return Promise.all(query.map(this._find.bind(this)));
        }
        return this._find(query);
    }
}

module.exports = ImageSearcher;