/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { hook } from '../../src/index';
import * as assert from 'assert';

hook('semver', '5.x', (loadModule, replaceSource, version) => {
  const semver = loadModule('semver.js');
  assert(version);
  assert(semver);

  process.send('done');
});

require('semver');