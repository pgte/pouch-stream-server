var Stream = require('./stream');

module.exports = Wrap;

function Wrap(db) {
  return Stream(db);
}