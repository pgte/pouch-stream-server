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
      var opts = options;
      if (options && (Array.isArray(options) || (typeof options !== 'object'))) {
        opts = { databases: options };
      }

      return Stream(dbs, extend({}, serverOptions || {}, opts));
    },
  };
}
