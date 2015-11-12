# pouch-stream-server

[![By](https://img.shields.io/badge/made%20by-yld!-32bbee.svg?style=flat)](http://yld.io/contact?source=github-nock)
[![Build Status](https://secure.travis-ci.org/pgte/pouch-stream-server.svg)](http://travis-ci.org/pgte/pouch-stream-server)

PouchDB stream server. Serves generic PouchDB object streams.

Goes well with [`pouch-remote-stream`](https://github.com/pgte/pouch-remote-stream) on the client.

## PouchDB

For now, it' only works with PouchDB v4.0. Compatibility with the new PouchDB v5 is being developed on [this branch](https://github.com/pgte/pouch-stream-server/tree/pouchdb-5)

## Install

```
$ npm install pouch-server-stream --save
```


## Use

```js
var PouchDB = require('pouchdb');

// Create DB
var db = new PouchDB('mydb');

var PouchStreamServer = require('pouch-stream-server');


// Create a server

var server = PouchStreamServer();

// Add a database to it

server.dbs.add('mydb', db);

// Connect the streams

netServer.on('connection', function(conn) {
  var stream = server.stream();
  stream.pipe(conn).pipe(stream);
});
```

## API

### PouchStreamServer([options])

Creates a Pouch Stream server. Example:

```js
var PouchStreamServer = require('pouch-stream-server');
var server = PouchStreamServer(options);
```

`options` is an optional object with any of the following keys:

* `highWaterMark`: The maximum number of objects to store in the internal buffer before ceasing to read from the underlying resource (when reading) or inducing back-pressure (when writing). Defaults to 16.
 
### server

#### server.dbs.add(dbName, db)

Adds a database that can be addressed by name from the remote stream. Example:

```js
var db = new PouchDB('mydb');
server.dbs.add('myremotedb', db);
```

#### server.stream([options])

Returns a stream to be used to talk to a remote client.

`options` is an optional object with the following optional keys:

* `highWaterMark`: The maximum number of objects to store in the internal buffer before ceasing to read from the underlying resource (when reading) or inducing back-pressure (when writing). Defaults to 16.
* databases: Indication of which databases are allowed to use this stream. Defaults to any. Can be either:
  * a string containing the name of the one allowed database
  * an array of strings containing the names of the allowed databases
  * a filter function that accepts the database name and returns a truthy value if the database is allowed to be used in this stream.

# License

ISC