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
var PouchStreamServer = require('../');

describe('Wrapper', function() {

  PouchDB.adapter('remote', PouchRemoteStream.adapter);

  var serverDB = new PouchDB({
    name: 'mydb',
    db: require('memdown'),
  });

  var server = PouchStreamServer();
  server.dbs.add('mydb', serverDB)

  var remote = PouchRemoteStream();

  var clientDB = new PouchDB('mydb', {
    adapter: 'remote',
    remote: remote,
  });

  var lastResult;

  it('can be created and piped into a stream', function(done) {
    var clientStream = remote.stream();
    var serverStream = server.stream();

    clientStream.pipe(serverStream).
    pipe(clientStream);
    done();
  });

  it('can post a document', function(done) {
    clientDB.post({a:1, b:2}, function(err, result) {
      expect(err).to.be.null();
      expect(result).to.be.an.object();
      lastResult = result;
      done();
    });
  });

  it('can get a document', function(done) {
    clientDB.get(lastResult.id, function(err, result) {
      expect(err).to.be.null();
      expect(result).to.be.an.object();
      expect(result).to.deep.equal({
        a:1, b:2, _id: lastResult.id, _rev: lastResult.rev
      });
      done();
    });
  });

});
