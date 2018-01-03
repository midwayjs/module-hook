/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { hook } from '../../src/index';
import * as assert from 'assert';
import * as sinon from 'sinon';
import { ModuleHook } from '../../src/lib/ModuleHook';

const moduleHook = ModuleHook.getInstance();

sinon.stub(moduleHook, 'doHook').throws();

hook('semver', '5.x', (loadModule, replaceSource, version) => {
  assert(version);

  replaceSource('semver.js', (source) => {
    return 'module.exports = 1';
  });
});

const semver = require('semver');
assert(semver !== 1);
(<any>moduleHook.doHook).restore();
process.send('done');