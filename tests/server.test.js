var Tests = require('pouch-stream-tests');
exports.lab = Tests.lab;
Tests(require('pouch-remote-stream'), require('../'));