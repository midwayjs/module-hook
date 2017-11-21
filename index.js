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
		for(let item of handle) {
			if (semver.satisfies(version, item.version)) {
				item.handler(function loadModule(filename) {
					return require(path.join(info.path, filename));
				}, function replaceSource(filename, replace) {
					const realPath = path.join(info.path, filename);
					if (typeof replace === 'function') {
						compile[realPath] = replace;
					}	else if (typeof replace === 'string' && fs.existsSync(replace)) {
						compile[realPath] = function() {
							return fs.readFileSync(replace, 'utf8');
						}
					}
				});
			}
		}
	}
});

hook.on('beforeCompile', (info, callback) => {
	const filename = info.filename;
	if (compile[filename]) {
		callback(compile[filename](info.content));
	} else {
		callback(info.content);
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
