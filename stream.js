'use strict';

var debug = require('debug')('pouch-stream-server:stream');
var TransformStream = require('stream').Transform;
var extend = require('xtend');
var inherits = require('util').inherits;
var methodMap = require('./method-map');
var methodWrapper = require('./method-wrap');

var defaults = {
  databases: any,
  objectMode: true,
};

module.exports = Stream;

function Stream(dbs, options) {
  if (! (this instanceof Stream)) {
    return new Stream(dbs, options);
  }

  var opts = extend({}, defaults, options);
  this._dbs = dbs;

  if (typeof opts.databases !== 'function') {
    if (!Array.isArray(opts.databases)) {
      opts.databases = [opts.databases];
    }

    opts.databases = anyOf(opts.databases);
  }
  this._options = opts;

  TransformStream.call(this, opts);
}

inherits(Stream, TransformStream);

Stream.prototype._transform = function _transform(data, enc, callback) {
  var stream = this;
  var seq;

  if (! Array.isArray(data)) {
    stream._protocolError(new Error('require an array'));
    callback();
  } else {
    seq = data.shift();
    var dbName = data.shift();
    var db;
    if (this._options.databases(dbName)) {
      db = stream._dbs.find(dbName);
    }
    if (! db) {
      stream._sendReply(seq, new Error('No allowed database named ' + dbName));
      callback();
    } else {
      var method = data.shift();
      method = methodMap[method] || method;
      var args = data.shift() || [];

      debug('db: %s, method: %s, args: %j', dbName, method, args);

      args.push(cb);
      var fn = db[method];
      if (! fn || (typeof fn) !== 'function') {
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
  var error;
  if (err) {
    error = {
      message: err.message,
      status: err.status,
      name: err.name,
      error: err.error,
    };
  }
  this.push([seq, [error, reply]]);
};


Stream.prototype._protocolError = function protocolError(err) {
  this.push([-1, [{ message: err.message }]]);
  this.push(null);
};


function any() {
  return true;
}

function anyOf(values) {
  return function filter(val) {
    return values.indexOf(val) >= 0;
  };
}
