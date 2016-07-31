var google_speech = require('google-speech');

class Converter {
    constructor(API_KEY) {
        if (API_KEY) {
            this.apiKey = API_KEY;
        } else {
            throw ("Invalid api key");
        }
    }

    convert(file) {
        return new Promise((resolve, reject) => {
            google_speech.ASR({
                    developer_key: this.apiKey,
                    file: file,
                }, (err, response, body) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(this._bodyToResult(response.body));
                    }
                }
            );
        });
    }

    _bodyToResult(body) {
        let parsed = this._parseResponseBody(body);
        let result = parsed.result;
        var response = result[parsed.result_index].alternative.reduce(function (r, obj) {
            if (obj.confidence && ((!r.confidence) || (r.confidence && (r.confidence < obj.confidence)))) {
                r = obj;
            }
            return r;
        }, {});
        return response.transcript.split(' ');
    }

    _parseResponseBody(body) {
        var parsed = body.split('\n');
        parsed = parsed.reduce(function (res, response) {
            if (response.length) {
                let _parsed = JSON.parse(response);
                if (_parsed.result && Array.isArray(_parsed.result) && _parsed.result.length) {
                    return _parsed;
                }
            }
            return res;
        }, {});
        return parsed;
    }
}

module.exports = Converter;
