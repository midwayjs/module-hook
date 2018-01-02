'use strict';

const Module = require('module');
const path = require('path');
const EventEmitter = require('events');
const shimmer = require('shimmer');
const util = require('util');
const debug = util.debuglog('ModuleHook:Hook');

class Hook extends EventEmitter {
  constructor() {
    super();
    this.sourceReplacer = new Map();
    this.hookRequire();
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
        return base;
      } else {
        return _findBasePath(base);
      }
    }

    return _findBasePath(filepath);
  }

  register(filename, replacer) {
    this.sourceReplacer.set(filename, replacer);
    console.log('this.sourceReplacer: ', this.sourceReplacer);
  }

  hookRequire() {
    const self = this;

    shimmer.wrap(Module.prototype, '_compile', function(compile) {

      return function(content, filename) {
        debug('compile filename: ', filename);
        const replacer = self.sourceReplacer.get(filename);
        let replaced = content;

        if (replacer) {
          replaced = replacer(content);
        }

        return compile.call(this, replaced, filename);
      }
    });

    shimmer.wrap(Module, '_findPath', function(_findPath) {

      return function(request, paths, isMain) {
        debug('request: ', request);
        const filepath = _findPath(request, paths, isMain);
        debug('filename: ', filepath);

        if (filepath) {
          const name = request;
          const regex = new RegExp(`_(${name.replace('/', '_')})@(\\d+(\\.\\d+)*)@(${name})`);
          const match = regex.exec(filepath);
          debug('match: ', match);
          // 如果没有匹配结果，说明是类似 ./xxx/xxx 这种的应用，不是包名，忽略
          if (match) {
            const version = match[2];
            const basePath = self.findBasePath(request, filepath);
            debug('version: ', version);
            debug('basePath: ', basePath);

            self.emit('beforeRequire', {
              name: name,
              version: version,
              path: basePath
            });
          }
        }

        return filepath;
      };
    });

    // 清除在加载过程中缓存的包信息，保证之后的都会被 hook 处理
    Module._cache = Object.create(null);
  }
}

if (!global.__require__hook) {
  global.__require__hook = new Hook();
}

module.exports = global.__require__hook;