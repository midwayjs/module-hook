/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import { hook } from '../../src/index';
import * as assert from 'assert';
const Module = require('module');
// 因为 ModuleHook 加载了，所以有缓存，先清理掉
Module._cache = Object.create(null);

let times = 1;
hook('semver', '5.x', (loadModule, replaceSource, version) => {
  assert(version);
  const semver = loadModule('semver.js');
  semver._times = times++;
});

const semver_1 = require('semver');
assert(semver_1._times === 1);

const semver_2 = require('semver');
assert(semver_2._times === 1);

// 清理缓存后也不会再执行，一般不会重现，除非循环依赖
Module._cache = Object.create(null);

const semver_3 = require('semver');
assert(!semver_3._times);

process.send('done');