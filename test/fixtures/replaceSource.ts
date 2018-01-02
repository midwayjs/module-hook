/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { hook } from '../../src/index';
import * as assert from 'assert';

hook('debug', '3.x', (loadModule, replaceSource, version) => {
  assert(version);
  replaceSource('src/index.js', (source) => {
    return 'module.exports = 1';
  });
});

const debug = require('debug');
assert(debug === 1);
process.send('done');