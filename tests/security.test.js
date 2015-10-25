/* eslint func-names: 0 */
'use strict';

var Lab = require('lab');
var lab = exports.lab = Lab.script();
var describe = lab.experiment;
var it = lab.it;
var Code = require('code');
var expect = Code.expect;

var PouchStreamServer = require('../');
var PouchDB = require('pouchdb');

describe('Stream server', function() {
  var server = PouchStreamServer();

  describe('handles invalid protocol well', function() {
    it('by handling no array', function(done) {
      var stream = server.stream();
      stream.once('data', function(d) {
        expect(d).to.deep.equal([-1, [{message: 'require an array'}]]);
        stream.once('end', done);
      });
      stream.write(true);
    });

    it('by handling empty array', function(done) {
      var stream = server.stream();
      stream.once('data', function(d) {
        expect(d).to.deep.equal(
          [undefined,
            [
              {
                message: 'No allowed database named undefined',
                status: undefined,
                name: 'Error',
                error: undefined,
              }, undefined ]]);
        done();
      });
      stream.write([]);
    });

    it('by handling a non-function attribute', function(done) {
      var db = new PouchDB({
        name: 'myotherdb',
        db: require('memdown'),
      });
      server.dbs.add('somedb', db);

      var stream = server.stream('somedb');

      stream.once('data', function(d) {
        expect(d).to.deep.equal(
          [0,
            [
              {
                message: 'No method named _db_name',
                status: undefined,
                name: 'Error',
                error: undefined,
              }, undefined ]]);
        done();
      });
      stream.write([0, 'somedb', '_db_name', []]);
    });
  });

  describe('security', function() {
    server = PouchStreamServer();

    var db = new PouchDB({
      name: 'myotherdb',
      db: require('memdown'),
    });

    server.dbs.add('db1', db);
    server.dbs.add('db2', db);
    server.dbs.add('db3', db);

    it('can target one only database', function(done) {
      var stream = server.stream('db1');

      stream.once('data', function(d) {
        expect(d).to.deep.equal(
          [0,
            [
              {
                message: 'No allowed database named db2',
                status: undefined,
                name: 'Error',
                error: undefined,
              }, undefined ]]);
        done();
      });

      stream.write([0, 'db2']);
    });

    it('can target an array of databases', function(done) {
      var stream = server.stream(['db1', 'db2']);

      stream.once('data', function(d) {
        expect(d).to.deep.equal(
          [0,
            [
              {
                message: 'No method named _db_name',
                status: undefined,
                name: 'Error',
                error: undefined,
              }, undefined ]]);

        stream.once('data', function(d2) {
          expect(d2).to.deep.equal(
            [1,
              [
                {
                  message: 'No allowed database named db3',
                  status: undefined,
                  name: 'Error',
                  error: undefined,
                }, undefined ]]);
          done();
        });

        stream.write([1, 'db3', '_db_name', []]);
      });

      stream.write([0, 'db2', '_db_name']);
    });
  });
});
