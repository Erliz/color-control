var TarantoolConnection = require('tarantool-driver');
var conn = new TarantoolConnection({host:'127.0.0.1',port: 3301});
var connected = conn.connect();

const getColors = word => {
  return connected
    .then(() => conn.select('colors', 'pk', 1, 0, 'eq', [word]))
    .then(result => {
      if (result != "undefined" && result[0] != "undefined" && result[0][0] != "undefined") {
        return result[0][1];
      }
    })
    .catch(err => console.log(err));
}

const addColors = (words, colors) => {
  return Promise.all(words.map(word => {
    return getColors(word)
      .then(existColors => {
        existColors = existColors || [];
        var newColors = existColors.concat(colors);
        var colorsList = [];
        newColors = newColors.filter(el => {
          return colorsList.indexOf(el.join()) == -1;
        });

        conn
          .delete('colors', 'pk', [word])
          .then(() => conn.insert('colors', [word, newColors]))
          .catch(err => console.error(err));
      })
  }));
}

const getWordsFilter = () => connected.then(() => conn.select('word_filters', 'pk', 1, 0, 'all', []));
const addWordsFilter = (word) => connected.then(() => conn.insert('word_filters', [word]));

module.exports = {
  getColors,
  addColors,
  getWordsFilter,
};
