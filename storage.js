var TarantoolConnection = require('tarantool-driver');
const DEFAULT_OPTIONS = {
    host:'127.0.0.1',
    port: 3301
};

class AppStorage {
    constructor(options) {
        this.conn = new TarantoolConnection(Object.assign({}, DEFAULT_OPTIONS, options));
        this.connected = this.conn.connect();
    }

    getWordsFilter() {
        return this.connected.then(() => this.conn.select('word_filters', 'pk', 1, 0, 'all', []))
    }

    addWordsFilter(word) {
        return this.connected.then(() => this.conn.insert('word_filters', [word]))
    }

    getColors(word) {
        return this.connected
            .then(() => this.conn.select('colors', 'pk', 1, 0, 'eq', [word]))
            .then(result => {
                if (result != "undefined" && result[0] != "undefined" && result[0][0] != "undefined") {
                    return result[0][1];
                }
            })
            .catch(err => console.log(err));
    }

    addColor(words, colors) {
        return Promise.all(words.map(word => {
            return this.getColors(word)
                .then(existColors => {
                    existColors = existColors || [];
                    var newColors = existColors.concat(colors);
                    var colorsList = [];
                    newColors = newColors.filter(el => {
                        return colorsList.indexOf(el.join()) == -1;
                    });

                    this.conn
                        .delete('colors', 'pk', [word])
                        .then(() => conn.insert('colors', [word, newColors]))
                        .catch(err => console.error(err));
                })
        }));
    }
}

module.exports = AppStorage;

var s = new AppStorage();

s.getWordsFilter().then(res => console.log(res));