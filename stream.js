'use strict';

var debug = require('debug')('pouch-stream-server:stream');
var TransformStream = require('stream').Transform;
var extend = require('xtend');
var inherits = require('util').inherits;
var methodMap = require('./method-map');
var methodWrapper = require('./method-wrap');

var defaults = {
  objectMode: true,
};

module.exports = Stream;

function Stream(dbs, options) {
  if (! (this instanceof Stream)) {
    return new Stream(dbs, options);
  }

  var opts = extend({}, defaults, options);
  this._dbs = dbs;

  TransformStream.call(this, opts);
}

inherits(Stream, TransformStream);

Stream.prototype._transform = function _transform(data, enc, callback) {
  var stream = this;

  if (! Array.isArray(data)) {
    stream._protocolError(new Error('require an array'));
    callback();
  } else {
    var seq = data.shift();
    var dbName = data.shift();
    var db = stream._dbs.find(dbName);
    if (! db) {
      stream._sendReply(seq, new Error('No database named ' + dbName));
      callback();
    } else {
      var method = data.shift();
      method = methodMap[method] || method;
      var args = data.shift();

      debug('db: %s, method: %s, args: %j', dbName, method, args);

      args.push(cb);
      var fn = db[method];
      if (! fn || (typeof fn) != 'function') {
        stream._sendReply(seq, new Error('No method named ' + method));
        callback();
      } else {
        var wrapper = methodWrapper[method];
        if (wrapper) {
          fn = wrapper(fn, stream);
        }
        fn.apply(db, args);
      }
    }
  }

  function cb(err, result) {
    stream._sendReply(seq, err, result);
    callback();
  }
};

Stream.prototype._sendReply = function _sendReply(seq, err, reply) {
  this.push([seq, [err, reply]]);
};


Stream.prototype._protocolError = function protocolError(err) {
  this.push([-1, [{ message: err.message }]]);
  this.push(null);
};
