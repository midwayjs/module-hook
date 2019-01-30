/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import * as assert from 'assert';
import { ModuleHook } from './lib/ModuleHook';
import { IHookHandler } from './domain';

const moduleHook = ModuleHook.getInstance();

export function hook(name: string, version: string, handler: IHookHandler) {
  assert(typeof handler === 'function');

  moduleHook.register(name, version, handler);
}

export * from './domain';