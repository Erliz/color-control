var Speakable = require('speakable');
// let Promise = ('bluebird');
let fs = require('fs');
const request = require('request');
const ColorThief = require('color-thief');
const GOOGLE_API_KEY = 'AIzaSyAbkaL-lrOYyd4L3V5F3MFd49xyc3QYxzw';
const GOOGLE_SEARCH_ENGINE_ID = '018068978649505348845:iq5lou5ilfe';
var speakable = new Speakable({
    key: GOOGLE_API_KEY
}, {
    lang: 'ru-RU',
    sox_path: '/usr/local/bin/sox'
});
const google = require('googleapis');
const search = google.customsearch('v1');
var colorThief = new ColorThief();
var SerialPort = require("serialport");
// Promise.promisifyAll(fs);

const RED_COLOR = 'red';
const GREEN_COLOR = 'green';
const BLUE_COLOR = 'blue';


const arduino = new SerialPort("/dev/cu.usbmodem1411", {
  baudRate: 9600,
  parser: SerialPort.parsers.readline('\n'),
});

arduino.on('open', function() {
  console.log(`Arduino serial port opened`);
});

arduino.on('data', function (data) {
  console.log(`Arduino serial response: ${data}`);
});

const setLedValue = (color, value) => new Promise((resolve, reject) => {
  const request = `${color}:${value}`;
  arduino.write(`${request}\n`, err => {
    if (err) reject(err);
    arduino.drain(err => {
      if (err) reject(err);
      console.log(`Arduino serial request: ${request}`);
      resolve();
    });
  });
});

const setLedsValues = ({red = 0, green = 0, blue = 0}) => new Promise((resolve, reject) => {
  let request = `${RED_COLOR}:${red}|${GREEN_COLOR}:${green}|${BLUE_COLOR}:${blue}`;
  arduino.write(`${request}\n`, err => {
    if (err) reject(err);
    arduino.drain(err => {
      if (err) reject(err);
      console.log(`Arduino serial request: ${request}`);
      resolve();
    });
  });
});

let chain = new Promise(resolve => arduino.on('open', () => resolve()))
    .then(() => new Promise(resolve => arduino.on('data', (data) => {
      if (data.indexOf('Enter') > -1) {
        resolve();
      }
    })));

const showColor = ({red, green, blue}) => {
  return chain
    .then(() => setLedsValues({red, green, blue}))
    .catch(err => console.error(`Error: ${err.message}`));
};

const getContrast = ({red, green, blue}) => {
  red *= red;
  green *= green;
  blue *= blue;
  let max = Math.max(red, green, blue);
  return {
    red: Math.round(red * 255/max),
    green: Math.round(green * 255/max),
    blue: Math.round(blue * 255/max),
  }
};

arduino.on('error', function(err) {
  console.log('Error: ', err.message);
})

const requestImage = (query) => {
  search.cse.list({
    cx: GOOGLE_SEARCH_ENGINE_ID,
    auth: GOOGLE_API_KEY,
    num: 1,
    // imgColorType: 'color', // Returns black and white, grayscale, or color images: mono, gray, and color.
    // imgDominantColor Returns images of a specific dominant color: yellow, green, teal, blue, purple, pink, white, gray, black and brown.
    // imgSize: 'medium', //Returns images of a specified size, where size can be one of: icon, small, medium, large, xlarge, xxlarge, and huge.
    // imgType: 'clipart', // Returns images of a type, which can be one of: clipart, face, lineart, news, and photo.
    // searchType: 'image',
    q: query,
  }, (err, data) => {
    if (err) throw err;
    console.log(data);
    if (data.items.length
        && data.items[0].pagemap
        && data.items[0].pagemap.cse_thumbnail.length) {
      const imgUrl = data.items[0].pagemap.cse_thumbnail[0].src;
      let filePath = `${query}.jpg`;
      console.log(`Image: ${imgUrl}`);
      request(imgUrl).pipe(fs.createWriteStream(filePath)).on('close', () => {
        [red, green, blue] = colorThief.getColor(filePath);
        console.log({red, green, blue});
        showColor({red, green, blue});
        showColor(getContrast({red, green, blue}));
      });
    }
  });
}

// showColor({red: 6, green: 255, blue: 0})
// showColor({red: 255, green: 0, blue: 125})
// showColor({red: 0, green: 255, blue: 3})

// showColor({red: 255, green: 255, blue: 255})
// showColor({red: 255, green: 255, blue: 0})
// showColor({red: 0, green: 255, blue: 255})
// showColor({red: 255, green: 0, blue: 255})
// showColor({red: 255, green: 0, blue: 0})
// showColor({red: 0, green: 255, blue: 0})
// showColor({red: 0, green: 0, blue: 255})
// { red: 218, green: 67, blue: 58 }
// showColor({red: 218, green: 67, blue: 58})
//   .then(() => setTimeout(() => {
//     let red = 218;
//     let green = 67;
//     let blue = 58;
//     red *= red;
//     green *= green;
//     blue *= blue;
//     let max = Math.max(red, green, blue);
//     red = Math.round(red * 255/max);
//     green = Math.round(green * 255/max);
//     blue = Math.round(blue * 255/max);
//     showColor({red, green, blue});
//   }), 1000);


const startRecord = () => {
  speakable.on('speechStop', function() {
    console.log('onSpeechStop');
  });

  speakable.on('error', function(err) {
    console.log('onError:');
    console.log(err);
    speakable.recordVoice();
  });

  speakable.on('speechResult', function(recognizedWords) {
    console.log('onSpeechResult:')
    console.log(recognizedWords);
    if (recognizedWords.length) {
      requestImage(recognizedWords[0]);
    }
    speakable.recordVoice();
  });

  speakable.recordVoice();
};

startRecord();
