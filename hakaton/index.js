const GOOGLE_API_KEY = 'AIzaSyAbkaL-lrOYyd4L3V5F3MFd49xyc3QYxzw';
const GOOGLE_SEARCH_ENGINE_ID = '018068978649505348845:iq5lou5ilfe';
const COLORIZER_DIR = __dirname + '/temp';

//const Converter = require('./lib/voice-to-text.js');
const Recorder = require('./lib/recorder.js');
const ImageSearcher = require('./lib/search-img.js');
const Colorizer = require('./lib/colorizer.js');
const Morpher = require('./lib/morpher.js');
const AppStorage = require('./lib/storage.js');

const DEVICE_IP = '100.100.148.82';
const DB_OPTIONS = {host: DEVICE_IP};
const MQQT_OPTIONS = {host: DEVICE_IP, port: 1883};

//let converter = new Converter(GOOGLE_API_KEY);
let searcher = new ImageSearcher(GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID);
let colorizer = new Colorizer(COLORIZER_DIR);
let morpher = new Morpher();
let recorder = new Recorder(GOOGLE_API_KEY);
let storage = new AppStorage(DB_OPTIONS, MQQT_OPTIONS);

const findColor = (words) => {
    console.log('START SEARCH COLOR', words);
    return Promise.all(words.map((word) => {
        return new Promise((resolve, reject) => {
            console.log('SEARCH FOR', word);
            storage.getColors(word).then((dbColor) => {
                console.log('GETTING FORM DB', dbColor);
                if (dbColor && dbColor[0] && dbColor[0][0]) {
                    let resolveColor = dbColor[0];
                    console.log('RESOLVE DB', resolveColor);
                    resolve(resolveColor);
                } else {
                    console.log("DONT FIND IN DB -> SEARCH IN INTERNET");
                    searcher.find(word).then(colorizer.getColor.bind(colorizer)).then(searchedColor => {
                        console.log('FIND COLOR IN INTERNET', searchedColor)
                        morpher.morph(word).then(morphedWords => {
                            storage.addColor(morphedWords, [searchedColor]).then(() => {
                                resolve(searchedColor);
                            }).catch(reject);
                        });
                    }).catch(reject)
                }
            }).catch(reject);
        })
    }));
};


recorder.startRecord((words) => {
    words = words.map((word) => {
        return word.toLowerCase();
    });

    console.log('FINDED WORDS', words);
    storage.getWordsFilter().then((filters) => {
        return words.reduce((_, word) => {
            if (filters.indexOf(word) > -1) {
                _.push(word);
            }
            return _
        }, [])
    }).then(words => {
        console.log('FILTERED COLORS', words);
        if (words.length) {
            findColor(words).then(colors => {
                colors.forEach(storage.pushColor.bind(storage));
            }).catch(err => console.log('ERROR', err));
        }
    }).catch(err => console.log('ERROR', err))
});
//storage.pushColor([255,0,0]);

//converter.convert(testFile2)
//    .then((res) => {
//        console.log('WORDS', res);
//        return searcher.find(res);
//    }).then((res) => {
//        console.log('IMAGES', res);
//    }).catch((err) => {
//        console.log(err);
//    });

//colorizer.getColor(['http://blacksea-education.ru/faq/image/021_06.jpg']).then((res) => {
//    console.log(res);
//});

//morpher.morph('Синий лес').then((res) => {
//    console.log(res);
//});


//[ 'и', 'Пошли', 'они', 'в', 'сторону', 'шлюпок', 'к', 'морю' ]

/**
[   'http://www.voloskova.ru/uploads/posts/2012-03/1332869865_2.jpg',
    'http://img0.liveinternet.ru/images/attach/c/2//67/265/67265256_i.gif',
    'https://upload.wikimedia.org/wikipedia/ru/c/cc/%D0%92%D0%BE%D0%B8%D0%BD%D1%8B_%D0%A2%D1%91%D0%BC%D0%BD%D1%8B%D1%85_%D0%AD%D0%BB%D1%8C%D0%B4%D0%B0%D1%80.jpg',
    'http://www.explorebyyourself.com/images/cms/data/amazon-jungle.jpeg',
    'http://online-azbuka.ru/image/bukvav.jpg',
    'http://www.fresher.ru/manager_content/images/xleb-i-krov-na-obochine-transsiba/17.jpg',
    'http://www.animalsglobe.ru/wp-content/uploads/2011/10/%D0%BC%D0%B5%D0%B4%D0%B2%D0%B5%D0%B4%D1%8C.jpg' ]
 **/
