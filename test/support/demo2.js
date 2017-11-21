'use strict';
const hook = require('../../');
const assert = require('assert');

hook('semver', '5.x', (loadModule, replaceSource) => {
  replaceSource('semver.js', (source) => {
    return 'module.exports = "tj"';
  });
});

const a = require('semver');
assert(a === 'tj');
process.send('done');