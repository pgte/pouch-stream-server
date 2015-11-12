'use strict';

var debug = require('debug')('pouch-stream-server:method-wrap');
var CHANGE_EVENTS = ['error', 'change', 'complete'];

module.exports = {
  _changes: _changes,
};

function _changes(fn, stream) {
  return function wrappedChanges(listener, options, cb) {
    var db = this;

    var changes = db.changes(options);
    CHANGE_EVENTS.forEach(function eachChangeEvent(event) {
      changes.on(event, onEvent);

      stream.once('finish', function() {
        changes.removeListener(event, onEvent);
      });

      function onEvent(payload) {
        debug('event %s (%j)', event, payload);
        stream.push(['_event', event, [listener, payload]]);
      }
    });
    cb();
  };
}
