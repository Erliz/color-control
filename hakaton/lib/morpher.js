const request = require('request');
const parser = require('xml2json');

const API_LINK = 'http://api.morpher.ru/WebService.asmx/GetXml';
const FINDED_MORPH_KEY = ["Р", "Д", "В", "Т", "П"];

class Morpher {
    constructor() {}

    _parseAndReturnArray(body) {
        let parsed = parser.toJson(body);
        let xml = JSON.parse(parsed).xml;
        return FINDED_MORPH_KEY.reduce((res, key) => {
            let value = xml[key];
            if (value && res.indexOf(value) === -1) {
                res.push(value);
            }
            return res;
        }, []);
    }

    _morph(text) {
        return new Promise((resolve, reject) => {
            request(API_LINK + '?s=' + encodeURIComponent(text), (err, response) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(this._parseAndReturnArray(response.body))
                }
            })
        });
    }
    morph(text) {
        if (Array.isArray(text)) {
            return Promise.all(text.map(this._morph.bind(this)));
        }
        return this._morph(text)
    }

}

module.exports = Morpher;

//var a = {
//    "xml": {
//        "xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
//        "xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
//        "xmlns": "http://morpher.ru/",
//        "Р": "Яны",
//        "Д": "Яне",
//        "В": "Яну",
//        "Т": "Яной",
//        "П": "Яне",
//        "ФИО": {"Ф": {}, "И": "Яна", "О": {}}
//    }
