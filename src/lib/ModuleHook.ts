/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

const Module = require('module');
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';
import { debuglog } from 'util';
import * as shimmer from 'shimmer';
import { satisfies } from 'semver';

const debug = debuglog('ModuleHook');
const MAX_DEEPTH = 10; // 最大探索深度

export class ModuleHook {

  static instance;

  static getInstance(): ModuleHook {
    if (!this.instance) {
      this.instance = new ModuleHook();
    }

    return this.instance;
  }

  handlers = new Map();
  sourceReplacer = new Map();
  hooked = new Set();

  constructor() {
    this.hookRequire();
  }

  register(name, version, handler) {
    if (!this.handlers.has(name)) {
      this.handlers.set(name, new Map([
        [version, handler]
      ]));
    } else {
      const versions = this.handlers.get(name);

      if (!versions.has(version)) {
        versions.set(version, handler);
      } else {
        debug('register duplicate module handler [%s@%s].', name, version);
      }
    }
  }

  private registerSourceReplacer(filepath, replacer) {
    if (!this.sourceReplacer.has(filepath)) {
      this.sourceReplacer.set(filepath, replacer);
    } else {
      debug('register duplicate source replacer for path: $s.', filepath);
    }
  }

  private findBasePath(name, filepath): string | boolean {
    if (path.basename(filepath, '.js') === path.basename(name, '.js') && path.dirname(name) !== '.') {
      name = path.dirname(name);
    }
    const linkRegex = new RegExp(`_(${name.replace('/', '_')})@(\\d+(\\.\\d+)*)@(${name})`);
    const match = linkRegex.exec(filepath);
    let deepth = 1;
    let nLen;
    let idx;

    // _name@version@name 的路径形式
    if (match) {
      // 在 name 前加一个 @，防止出现包名循环的情况
      name = '@' + name;
      nLen = name.length;
      idx = filepath.lastIndexOf(name);
    } else {
      // name 形式，可能包含相同名字，所以查找最后一个
      nLen = name.length;
      idx = filepath.lastIndexOf(name);
    }

    function _findBasePath(_filepath) {
      if (deepth > MAX_DEEPTH) {
        debug('find overflow MAX_DEEPTH, exit');
        return false;
      }

      deepth ++;
      let base = path.dirname(_filepath);
      let pLen = base.length;
      debug('_filepath: ', _filepath);
      // 如果路径长度减去包名长度等于所在位置
      // 则为包的根目录
      if (pLen - nLen === idx) {
        return base;
      } else {
        return _findBasePath(base);
      }
    }

    return _findBasePath(filepath);
  }

  private getModuleInfo(base) {
    if (!base) return null;

    const pkgPath = path.join(base, 'package.json');

    if (existsSync(pkgPath)) {
      try {
        let pkg = readFileSync(pkgPath);
        pkg = JSON.parse(String(pkg));

        return {
          version: (<any>pkg).version,
          main: (<any>pkg).main || 'index.js'
        };
      } catch(err) {
        debug('getModuleInfo failed. ', err);
        return null;
      }
    } else {
      return null;
    }
  }

  private signature(name, version) {
    return name + '@' + version;
  }

  private isModule(request) {
    return request && !request.startsWith('.') && !request.startsWith('/');
  }

  doHook = (name, version, base) => {
    const self = this;
    const versions = this.handlers.get(name);

    if (versions) {
      let handler = null;

      for (let [v, h] of versions) {
        if (satisfies(version, v)) {
          handler = h;
          break;
        }
      }

      if (handler) {
        const sign = this.signature(name, version);

        if (!this.hooked.has(sign)) {
          this.hooked.add(sign);

          return handler(
            function loadModule(filepath) {
              return require(path.join(base, filepath));
            },
            function replaceSource(filename, replacer) {
              const realPath = path.join(base, filename);

              if (typeof replacer === 'string') {
                const file = replacer;
                replacer = function sourceReplacer(content) {
                  if (existsSync(file)) {
                    return readFileSync(file, 'utf8');
                  } else {
                    debug('can\'t find replacer file: %s.', file);
                    return content;
                  }
                };
              }

              self.registerSourceReplacer(realPath, replacer);
            },
            version
          );
        } else {
          return debug('run hook for [%s@%s] again.', name, version);
        }
      }
    }

    // 在重复引用模块时会触发，或者循环依赖，防止发生多次修改。
    // 清除缓存后也不会再执行
    debug('no hook for [%s@%s].', name, version);
  }

  hookRequire() {
    const self = this;
    // 不能清空模块缓存，否则会导致直接模块的单例失败

    shimmer.wrap(Module.prototype, '_compile', function(compile) {

      return function(this: NodeModule, content, filename) {
        debug('compile filename: %s', filename);
        // 一般只会执行一次，如果模块缓存被清理，则会再执行
        const replacer = self.sourceReplacer.get(filename);
        let replaced = content;

        if (replacer) {
          replaced = replacer(content);
        }

        return compile.call(this, replaced, filename);
      };
    });

    shimmer.wrap(Module, '_findPath', function(_findPath) {

      return function(request, paths, isMain) {
        debug('request: %s', request);
        const filepath = _findPath(request, paths, isMain);
        debug('filepath: %s', filepath);

        // 不是模块名，直接返回
        if (!self.isModule(request)) {
          return filepath;
        }

        if (filepath) {
          const basePath = self.findBasePath(request, filepath);
          debug('basePath: %s', basePath);
          const moduleInfo = self.getModuleInfo(basePath);
          debug('basePath: %o', moduleInfo);

          if (moduleInfo) {
            try {
              self.doHook(request, moduleInfo.version, basePath);
            } catch(error) {
              debug(`doHook with [${request}, ${moduleInfo.version}, ${basePath}] failed. `, error);
            }
          }
        }

        return filepath;
      };
    });
  }
}
