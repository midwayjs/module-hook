'use strict';
import { hook } from '../../src/index';
import * as assert from 'assert';
import * as path from 'path';

hook('semver', '5.x', (loadModule, replaceSource) => {
  replaceSource('semver.js', path.join(__dirname, 'fakeModule.js'));
});

const a = require('semver');
assert(a === 1);
process.send('done');