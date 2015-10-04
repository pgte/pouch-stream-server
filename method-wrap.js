var debug = require('debug')('pouch-stream-server:method-wrap');
var CHANGE_EVENTS = ['error', 'change', 'complete'];

module.exports = {
  _changes: _changes,
};

function _changes(fn, stream) {
  return function(listener, options) {
    var db = this;

    var changes = db.changes(options);
    CHANGE_EVENTS.forEach(function(event) {
      changes.on(event, function(payload) {
        debug('event %s (%j)', event, payload);
        stream.push(['_event', event, [listener, payload]]);
      });
    });
  };
}