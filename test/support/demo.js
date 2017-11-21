'use strict';
const hook = require('../../');
const assert = require('assert');

hook('semver', '5.x', (loadModule, replaceSpurce) => {
  const semver = loadModule('semver.js');
  assert(semver);
  process.send('done');
});

require('semver');