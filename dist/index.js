"use strict";
/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const ModuleHook_1 = require("./lib/ModuleHook");
const moduleHook = ModuleHook_1.ModuleHook.getInstance();
function hook(name, version, handler) {
    assert(typeof handler === 'function');
    moduleHook.register(name, version, handler);
}
exports.hook = hook;
//# sourceMappingURL=index.js.map