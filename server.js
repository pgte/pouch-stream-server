var Stream = require('./stream');
var DBs = require('./dbs');

module.exports = Server;

function Server(options) {
  var dbs = DBs();
  return {
    dbs: dbs,
    stream: function(options) {
      return Stream(dbs, options);
    }
  };
}