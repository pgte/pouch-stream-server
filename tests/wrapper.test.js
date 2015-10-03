var Lab = require('lab');
var lab = exports.lab = Lab.script();
var before = lab.before;
var after = lab.after;
var describe = lab.experiment;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;

var async = require('async');

var PouchDB = require('pouchdb');
var PouchRemoteStream = require('pouch-remote-stream');
var PouchServerStream = require('../');

describe('Wrapper', function() {

  PouchDB.adapter('remote', PouchRemoteStream.adapter);

  var serverDB = new PouchDB({
    name: 'serverdb',
    adapter: require('memdown'),
  });

  var remote = PouchRemoteStream();

  var clientDB = new PouchDB('mydb', {
    adapter: 'remote',
    remote: remote,
  });

  it('can be created and piped into a stream', function(done) {
    var clientStream = remote.stream();
    console.log('client stream:', !!clientStream);
    var serverStream = PouchServerStream(serverDB);
    console.log('server stream:', !!serverStream);

    clientStream.pipe(serverStream).
    pipe(clientStream);
    done();
  });

  it('can post a document', function(done) {
    clientDB.post({a:1, b:2}, done);
  });

});
