'use strict';

var Stream = require('./stream');
var DBs = require('./dbs');
var extend = require('xtend');

module.exports = Server;

function Server(serverOptions) {
  var dbs = DBs();
  return {
    dbs: dbs,
    stream: function createStream(options) {
      return Stream(dbs, extend({}, serverOptions || {}, options));
    },
  };
}
