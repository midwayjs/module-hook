'use strict';
const hook = require('../../');
const assert = require('assert');

hook('debug', '3.x', (loadModule, replaceSource) => {
  replaceSource('src/index.js', (source) => {
    return 'module.exports = 1';
  });
});

const a = require('debug');
assert(a === 1);
process.send('done');