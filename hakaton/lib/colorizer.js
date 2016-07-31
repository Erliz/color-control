const ColorThief = require('color-thief');
const request = require('request');
const fs = require('fs');

let colorThief = new ColorThief();

class Colorizer {
    constructor(TEMP_DIR) {
        this.dir = TEMP_DIR;
    }

    _getTempName(url) {
        let id = (Date.now() * Math.random()).toString(16).slice(6);
        let splitted = url.split('.');
        let filename = [id, splitted[splitted.length - 1]].join('.');
        if (this.dir) {
            return [this.dir, filename].join('/');
        } else {
            return filename;
        }
    }

    _getColor(url) {
        let filename = this._getTempName(url);
        return new Promise((resolve, reject) => {
            request(url)
                .pipe(fs.createWriteStream(filename))
                .on('close', () => {
                    let color = colorThief.getColor(filename);
                    fs.unlink(filename, function(err){
                        resolve(color);
                    });
                })
        });
    }

    getColor(url) {
        if (Array.isArray(url)) {
            return Promise.all(url.map(this._getColor.bind(this)))
        }
        return this._getColor(url);
    }
}

/**
 [
 'http://www.voloskova.ru/uploads/posts/2012-03/1332869865_2.jpg',
 'http://img0.liveinternet.ru/images/attach/c/2//67/265/67265256_i.gif',
 'https://upload.wikimedia.org/wikipedia/ru/c/cc/%D0%92%D0%BE%D0%B8%D0%BD%D1%8B_%D0%A2%D1%91%D0%BC%D0%BD%D1%8B%D1%85_%D0%AD%D0%BB%D1%8C%D0%B4%D0%B0%D1%80.jpg',
 'http://www.explorebyyourself.com/images/cms/data/amazon-jungle.jpeg',
 'http://online-azbuka.ru/image/bukvav.jpg',
 'http://www.fresher.ru/manager_content/images/xleb-i-krov-na-obochine-transsiba/17.jpg',
 'http://www.animalsglobe.ru/wp-content/uploads/2011/10/%D0%BC%D0%B5%D0%B4%D0%B2%D0%B5%D0%B4%D1%8C.jpg'
 ]
 **/

module.exports = Colorizer;