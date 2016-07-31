const TarantoolConnection = require('tarantool-driver');
const mqtt = require('mqtt');
const DEFAULT_STORAGE_OPTIONS = {
    host:'127.0.0.1',
    port: 3301
};

const DEFAULT_MQTT_OPTIONS = {
    host: '127.0.0.1',
    port: '1883'
};

class AppStorage {
    constructor(storageOptions, mqttOptions) {
        storageOptions = Object.assign({}, DEFAULT_STORAGE_OPTIONS, storageOptions);
        mqttOptions = Object.assign({}, DEFAULT_MQTT_OPTIONS, mqttOptions);
        this.conn = new TarantoolConnection(storageOptions);
        this.connected = this.conn.connect();
        this.mqttClient = mqtt.connect(['mqtt://', mqttOptions.host + ':' + mqttOptions.port].join(''));
    }

    pushColor(color) {
        if (color && Array.isArray(color) && color.length === 3) {
            this.mqttClient.publish('devices/rgbLed/set', color.join(' '));
        }
    }

    getWordsFilter() {
        return this.connected.then(() => {
            return this.conn.select('word_filters', 'pk', 10000, 0, 'all', [])
                .then(filterResult => {
                    return this.conn.select('colors', 'pk', 10000, 0, 'all', [])
                        .then(colorsResult => {
                            return filterResult.map(el => el[0]).concat(colorsResult.map(el => el[0]));
                        });
                });
        });
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
