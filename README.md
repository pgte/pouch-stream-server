# pouch-server-stream

Server PouchDB stream

## Install

```
$ npm install pouch-server-stream --save
```


## Use

```js
var PouchDB = require('pouchdb');

// Create DB
var db = new PouchDB('mydb');

var PouchServerStream = require('pouch-server-stream');


// Create a server

var server = PouchServerStream();

// Add databases to it

server.dbs.add(db);

// Stream from and into it:

netServer.on('connection', function(conn) {
  var stream = server.stream();
  stream.pipe(conn).pipe(stream);
});

``