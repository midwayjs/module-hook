'use strict';

const hook = require('./hook');
const semver = require('semver');
const handlers = {};
const path = require('path');
const fs = require('fs');
const shimmer = require('shimmer');
const assert = require('assert');
const compile = {};

hook.on('beforeRequire', (info) => {
  const name = info.name;
  const version = info.version;
  const handle = handlers[name];
  if (handle && handle.length) {
    for (let item of handle) {
      if (semver.satisfies(version, item.version)) {
        if (item.handler.wrapped) continue;

        item.handler(function loadModule(filename) {
          return require(path.join(info.path, filename));
        }, function replaceSource(filename, replace) {
          console.log('info.path: ', info.path);
          const realPath = path.join(info.path, filename);
          console.log('realPath: ', realPath);
          let replacer;
          if (typeof replace === 'function') {
            replacer = replace;
          } else if (typeof replace === 'string' && fs.existsSync(replace)) {
            replacer = function() {
              return fs.readFileSync(replace, 'utf8');
            }
          }

          hook.register(realPath, replacer);
        }, version);

        item.handler.wrapped = true;
      }
    }
  }
});

module.exports = function(name, version, handler) {
  assert(typeof handler === 'function');
  if (!handlers[name]) {
    handlers[name] = [];
  }
  handlers[name].push({
    version,
    handler
  });
}