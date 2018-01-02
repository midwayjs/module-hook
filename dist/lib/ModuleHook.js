"use strict";
/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const Module = require('module');
const fs_1 = require("fs");
const path = require("path");
const util_1 = require("util");
const shimmer = require("shimmer");
const semver_1 = require("semver");
const debug = util_1.debuglog('ModuleHook');
class ModuleHook {
    constructor() {
        this.handlers = new Map();
        this.sourceReplacer = new Map();
        this.hooked = new Set();
        this.doHook = (name, version, base) => {
            const self = this;
            const versions = this.handlers.get(name);
            if (versions) {
                let handler = null;
                for (let [v, h] of versions) {
                    if (semver_1.satisfies(version, v)) {
                        handler = h;
                        break;
                    }
                }
                if (handler) {
                    const sign = this.signature(name, version);
                    if (!this.hooked.has(sign)) {
                        this.hooked.add(sign);
                        return handler(function loadModule(filepath) {
                            return require(path.join(base, filepath));
                        }, function replaceSource(filename, replacer) {
                            const realPath = path.join(base, filename);
                            if (typeof replacer === 'string' && fs_1.existsSync(replacer)) {
                                replacer = function sourceReplacer() {
                                    return fs_1.readFileSync(replacer, 'utf8');
                                };
                            }
                            self.registerSourceReplacer(realPath, replacer);
                        }, version);
                    }
                    else {
                        return debug('run hook for [%s@%s] again.', name, version);
                    }
                }
            }
            debug('no hook for [%s@%s].', name, version);
        };
        this.hookRequire();
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new ModuleHook();
        }
        return this.instance;
    }
    register(name, version, handler) {
        if (!this.handlers.has(name)) {
            this.handlers.set(name, new Map([
                [version, handler]
            ]));
        }
        else {
            const versions = this.handlers.get(name);
            if (!version.has(version)) {
                versions.set(version, handler);
            }
            else {
                debug('register duplicate module handler [%s@%s].', name, version);
            }
        }
    }
    registerSourceReplacer(filepath, replacer) {
        if (!this.sourceReplacer.has(filepath)) {
            this.sourceReplacer.set(filepath, replacer);
        }
        else {
            debug('register duplicate source replacer for path: $s.', filepath);
        }
    }
    findBasePath(name, filepath) {
        // 因为 npm 包路径为 name@version@name 的形式，
        // 所以在 name 前加一个 @，防止出现包名循环的情况
        name = '@' + name;
        const nLen = name.length;
        const idx = filepath.indexOf(name);
        function _findBasePath(_filepath) {
            let base = path.dirname(_filepath);
            let pLen = base.length;
            debug('_filepath: ', _filepath);
            // 如果路径长度减去包名长度等于所在位置
            // 则为包的根目录
            if (pLen - nLen === idx) {
                return base || false;
            }
            else {
                return _findBasePath(base);
            }
        }
        return _findBasePath(filepath);
    }
    signature(name, version) {
        return name + '@' + version;
    }
    hookRequire() {
        const self = this;
        shimmer.wrap(Module.prototype, '_compile', function (compile) {
            return function (content, filename) {
                debug('compile filename: %s', filename);
                const replacer = self.sourceReplacer.get(filename);
                let replaced = content;
                if (replacer) {
                    replaced = replacer(content);
                }
                return compile.call(this, replaced, filename);
            };
        });
        shimmer.wrap(Module, '_findPath', function (_findPath) {
            return function (request, paths, isMain) {
                debug('request: %s', request);
                const filepath = _findPath(request, paths, isMain);
                debug('filename: %s', filepath);
                if (filepath) {
                    const name = request;
                    const regex = new RegExp(`_(${name.replace('/', '_')})@(\\d+(\\.\\d+)*)@(${name})`);
                    const match = regex.exec(filepath);
                    debug('match: %j', match);
                    // 如果没有匹配结果，说明是相对路径引用，忽略
                    if (match) {
                        const version = match[2];
                        const basePath = self.findBasePath(request, filepath);
                        debug('version: %s', version);
                        debug('basePath: %s', basePath);
                        if (basePath) {
                            self.doHook(name, version, basePath);
                        }
                    }
                }
                return filepath;
            };
        });
        // 清除在加载过程中缓存的包信息，保证之后的都会被 hook 处理
        Module._cache = Object.create(null);
    }
}
exports.ModuleHook = ModuleHook;
//# sourceMappingURL=ModuleHook.js.map