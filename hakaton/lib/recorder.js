const Speakable = require('speakable');
const DEFAULT_OPTIONS = {
    lang: 'ru-RU',
    sox_path: '/usr/local/bin/sox'
};


class Recorder {
    constructor(API_KEY, OPTIONS) {
        console.log('I am is object', Object.assign({}, DEFAULT_OPTIONS, OPTIONS))
        if (!API_KEY) {
            throw new Error('Wrong api key');
        }
        this.speakable = new Speakable({
            key: API_KEY
        }, Object.assign({}, DEFAULT_OPTIONS, OPTIONS));

    }

    startRecord(callback) {
        this.speakable.on('speechStop', () => {
            console.log('onSpeechStop');
        });

        this.speakable.on('error', (err) => {
            console.log('onError:');
            console.log(err);
            this.speakable.recordVoice();
        });

        this.speakable.on('speechResult', (recognizedWords) => {
            console.log('onSpeechResult:');
            if (typeof callback === 'function') {
                callback(recognizedWords)
            }
            this.speakable.recordVoice();
        });

        this.speakable.recordVoice();
    }
}

module.exports = Recorder