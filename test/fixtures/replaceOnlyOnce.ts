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
  replaceSource('semver.js', (source) => {
    return 'module.exports = ' + times++ ;
  });
});

const semver_1 = require('semver');
assert(semver_1 === 1);

// 读取的缓存，不会替换
const semver_2 = require('semver');
assert(semver_2 === 1);

// 清除缓存后，会再次编译，所以会再替换
Module._cache = Object.create(null);

const semver_3 = require('semver');
assert(semver_3 === 2);
process.send('done');