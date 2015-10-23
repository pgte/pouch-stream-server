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
                message: 'No database named undefined',
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

      var stream = server.stream();

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
});
