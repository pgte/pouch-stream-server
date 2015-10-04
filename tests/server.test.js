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

describe('Stream server', function() {

  PouchDB.adapter('remote', PouchRemoteStream.adapter);

  var serverDB = new PouchDB({
    name: 'mydb',
    db: require('memdown'),
  });

  var server = PouchStreamServer();

  var remote = PouchRemoteStream();

  var clientDB = new PouchDB('mydb', {
    adapter: 'remote',
    remote: remote,
  });

  var results = [];
  var newDBResult;

  var newDB = new PouchDB({
    name: 'myotherdb',
    db: require('memdown'),
  });

  before(function(done) {
    newDB.post({c:3, d:4}, function(err, newResult) {
      newDBResult = newResult;
      done(err);
    });
  });

  it('can be created and piped into a stream', function(done) {
    var clientStream = remote.stream();
    var serverStream = server.stream();

    clientStream.pipe(serverStream).
    pipe(clientStream);
    done();
  });

  it('doesnt work if server does not know database', function(done) {
    clientDB.post({a:1,b:2}, function(err, result) {
      expect(err).to.not.be.null();
      expect(err.message).to.equal('No database named mydb');
      done();
    });
  });

  it('allows you to add a database', function(done) {
    server.dbs.add('mydb', serverDB)
    done();
  });

  it('can post a document', function(done) {
    clientDB.post({a:1, b:2}, function(err, result) {
      expect(err).to.be.null();
      expect(result).to.be.an.object();
      results.push(result);
      done();
    });
  });

  it('can get a document', function(done) {
    var lastResult = results[results.length - 1];
    clientDB.get(lastResult.id, function(err, result) {
      var lastResult = results[results.length - 1];
      expect(err).to.be.null();
      expect(result).to.be.an.object();
      expect(result).to.deep.equal({
        a:1, b:2, _id: lastResult.id, _rev: lastResult.rev
      });
      done();
    });
  });

  it('can get changes feed', function(done) {
    var lastResult = results[results.length - 1];
    var feed = clientDB.changes();
    feed.once('change', function(change) {
      expect(change).to.be.an.object();
      expect(change).to.deep.equal({
        id: lastResult.id,
        changes: [{rev: lastResult.rev}],
        seq: 1
      });

      feed.once('complete', function() {
        done();
      });

    });

    feed.on('error', function(err) {
      throw err;
    });

  });

  it('can get replicated into', function(done) {
    var repl = newDB.replicate.to(clientDB);

    repl.once('error', function(err) {
      console.error(err.stack);
      throw err;
    });
    repl.once('complete', function() {
      clientDB.get(newDBResult.id, function(err, doc) {
        expect(err).to.be.null();
        expect(doc).to.be.an.object();
        expect(doc).to.deep.equal({
          c: 3,
          d: 4,
          _id: newDBResult.id,
          _rev: newDBResult.rev,
        });
        done();
      });
    });
  });

  it('can sync two databases', function(done) {

    async.waterfall([
      function(cb) {
        newDB.post({e:5, f:6}, cb);
      },
      function(doc1, cb) {
        clientDB.post({g: 7, h: 8}, function(err, doc2) {
          cb(err, doc1, doc2);
        });
      },
      function(doc1, doc2, cb) {
        var sync = clientDB.sync(newDB);
        cb(null, doc1, doc2, sync);
      },
      function(doc1, doc2, sync, cb) {
        sync.once('complete', function() {
          cb(null, doc1, doc2);
        });
      },
      function(doc1, doc2, cb) {
        clientDB.get(doc1.id, function(err, syncedDoc) {
          cb(err, syncedDoc, doc2);
        });
      },
      function(syncedDoc, doc2, cb) {
        expect(syncedDoc).to.be.an.object();
        expect(syncedDoc.e).to.equal(5);
        expect(syncedDoc.f).to.equal(6);
        cb(null, doc2);
      },
      function(doc2, cb) {
        newDB.get(doc2.id, cb);
      },
      function(syncedDoc, cb) {
        expect(syncedDoc).to.be.an.object();
        expect(syncedDoc.g).to.equal(7);
        expect(syncedDoc.h).to.equal(8);
        cb();
      }
      ], done);
  });

  it('can live sync 2 databases', function(done) {
    var sync = clientDB.sync(newDB, {live: true});
    async.series([
      function(cb) {
        // test in 1 direction
        sync.on('change', function onChange(change) {
          if (change.change.docs.length) {
            delete change.change.docs[0]._rev;
            expect(change.change.docs[0]).to.deep.equal({
              i: 9,
              _id: 'fromclientdb1'
            });
            sync.removeListener('change', onChange);
            cb();
          }
        });

        clientDB.put({_id: 'fromclientdb1', i: 9}, function(err) {
          expect(err).to.be.null();
        });
      },
      function(cb) {
        // test in the other direction
        sync.on('change', function onChange(change) {
          if (change.change.docs.length) {
            delete change.change.docs[0]._rev;
            expect(change.change.docs[0]).to.deep.equal({
              j: 10,
              _id: 'fromnewdb1',
            });
            sync.removeListener('change', onChange);
            cb();
          }
        });

        newDB.put({_id: 'fromnewdb1', j: 10}, function(err) {
          expect(err).to.be.null();
        });
      },
      function(cb) {
        // test cancelation
        sync.cancel();
        cb();
      }
      ], done);
  });

});

function xit(){}