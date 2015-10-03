'use strict';

var debug = require('debug')('pouchdb-server-stream:stream');
var TransformStream = require('stream').Transform;
var stream = require('stream');
var extend = require('xtend');
var inherits = require('util').inherits;
var duplexify = require('duplexify');
var methodMap = require('./method-map');

var defaults = {
  objectMode: true
};

module.exports = Stream;

function Stream(db, options) {
  if (! (this instanceof Stream)) {
    return new Stream(db, options);
  }

  var opts = extend({}, defaults, options);
  this._db = db;

  TransformStream.call(this, opts);
}

inherits(Stream, TransformStream);

Stream.prototype._transform = function _transform(data, enc, callback) {
  var stream = this;
  var seq = data.shift();
  var db = data.shift();
  var method = data.shift();
  method = methodMap[method] || method;
  var args = data.shift();

  debug('db: %s, method: %s, args: %j', db, method, args);

  args.push(cb);
  var fn = this._db[method];
  if (! fn || (typeof fn) != 'function') {
    stream._sendReply(seq, new Error('No method named ' + method));
  } else {
    fn.apply(this._db, args);
  }

  function cb(err, result) {
    stream._sendReply(seq, err, result);
    callback();
  }
};

Stream.prototype._sendReply = function _sendReply(seq, err, reply) {
  this.push([seq, [err, reply]]);
};
