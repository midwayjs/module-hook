'use strict';

const Module = require('module');
const assert = require('assert').ok;
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const shimmer = require('shimmer');
const moduleCache = {};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function statPath(path) {
  try {
    return fs.statSync(path);
  } catch (ex) {}
  return false;
}

// check if the directory is a package.json dir
const packageMainCache = {};

class Hook extends EventEmitter {
  constructor() {
    super();
    this.hookRequire();
  }

  readPackage(requestPath) {
    if (hasOwnProperty(packageMainCache, requestPath)) {
      return packageMainCache[requestPath];
    }

    try {
      var jsonPath = path.resolve(requestPath, 'package.json');
      var json = fs.readFileSync(jsonPath, 'utf8');
    } catch (e) {
      return false;
    }

    try {
      var pkg = packageMainCache[requestPath] = JSON.parse(json);
    } catch (e) {
      e.path = jsonPath;
      e.message = 'Error parsing ' + jsonPath + ': ' + e.message;
      throw e;
    }
    return pkg;
  }

  tryPackage(requestPath, exts) {
    const pkg = this.readPackage(requestPath);
    if (!(pkg && pkg.main)) {
      return false;
    }

    const resolved = pkg['_resolved'];
    const main = pkg.main;

    let filename;

    if(resolved) {
      filename =  moduleCache[resolved] || (moduleCache[resolved] = path.resolve(requestPath, main));
    }else{
      filename = path.resolve(requestPath, main);
    }

    this.emit('beforeRequire', {
      name: pkg.name,
      version: pkg.version,
      path: requestPath,
      'package': pkg,
    });

    return this.tryFile(filename) ||
           this.tryExtensions(filename, exts) ||
           this.tryExtensions(path.resolve(filename, 'index'), exts);
  }

  tryFile(requestPath) {
    const stats = statPath(requestPath);
    if (stats && !stats.isDirectory()) {
      return fs.realpathSync(requestPath, Module._realpathCache);
    }
    return false;
  }

  // given a path check a the file exists with any of the set extensions
  tryExtensions(p, exts) {
    for (let i = 0, EL = exts.length; i < EL; i++) {
      const filename = this.tryFile(p + exts[i]);
      if (filename) {
        return filename;
      }
    }
    return false;
  }

  hookRequire() {
    const self = this;

    shimmer.wrap(Module.prototype, '_compile', function(compile) {
      return function(content, filename) {
        const info = {
          content,
          filename
        };
        let source = info.content;
        self.emit('beforeCompile', info, function(content) {
          source = content;
        });
        return compile.call(this, source, info.filename);
      }
    });

    Module._findPath = function(request, paths) {
       var exts = Object.keys(Module._extensions);

        if (request.charAt(0) === '/') {
          paths = [''];
        }

        var trailingSlash = (request.slice(-1) === '/');

        var cacheKey = JSON.stringify({request: request, paths: paths});
        if (Module._pathCache[cacheKey]) {
          return Module._pathCache[cacheKey];
        }

        // For each path
        for (var i = 0, PL = paths.length; i < PL; i++) {
          let basePath = path.resolve(paths[i], request);
          let filename;

          if (!trailingSlash) {
            // try to join the request to the path
            filename = self.tryFile(basePath);
            if (!filename && !trailingSlash) {
              // try it with each of the extensions
              filename = self.tryExtensions(basePath, exts);
            }
          }

          if (!filename) {
            filename = self.tryPackage(basePath, exts);
          }

          if (!filename) {
            filename = self.tryExtensions(path.resolve(basePath, 'index'), exts);
          }

          if (filename) {
            Module._pathCache[cacheKey] = filename;
            return filename;
          }
        }
        return false;
      };
  }
}

if (!global.__require__hook) {
  global.__require__hook = new Hook();
}
module.exports = global.__require__hook;
