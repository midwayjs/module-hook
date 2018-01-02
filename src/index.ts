/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import * as assert from 'assert';
import { ModuleHook } from './lib/ModuleHook';

const moduleHook = ModuleHook.getInstance();

export function hook(name, version, handler) {
  assert(typeof handler === 'function');

  moduleHook.register(name, version, handler);
}