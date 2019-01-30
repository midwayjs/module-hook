/**
 * @fileOverview
 * @author 凌恒 <jiakun.dujk@alibaba-inc.com>
 * @copyright 2017 Alibaba Group.
 */

import * as path from 'path';
import { expect } from 'chai';
import { ModuleHook } from '../../src/lib/ModuleHook';

describe('test/unit/ModuleHook.test.ts', function() {
  let moduleHook = ModuleHook.getInstance();

  describe('findBasePath', function() {
    it('should work with npm link path', function() {
      const origin = '/Users/mariodu/Documents/work/Midway/pandora/packages/metrics/node_modules/_debug@2.6.9@debug/src/index.js';
      const base = moduleHook['findBasePath']('debug', origin);

      expect(base).to.equal('/Users/mariodu/Documents/work/Midway/pandora/packages/metrics/node_modules/_debug@2.6.9@debug');
    });

    it('should work with npm file path', function() {
      const origin = '/Users/mariodu/Documents/work/Midway/pandora/packages/metrics/node_modules/pandora-shimmer-test/index.js';
      const base = moduleHook['findBasePath']('pandora-shimmer-test', origin);

      expect(base).to.equal('/Users/mariodu/Documents/work/Midway/pandora/packages/metrics/node_modules/pandora-shimmer-test');
    });

    it('should work with same name in path', function() {
      const origin = '/Users/mariodu/Documents/work/ali-pandora/packages/component-auto-patching/node_modules/@ali/hsf-server-v4/node_modules/hsf-server/lib/server.js';
      const base = moduleHook['findBasePath']('hsf-server', origin);

      expect(base).to.equal('/Users/mariodu/Documents/work/ali-pandora/packages/component-auto-patching/node_modules/@ali/hsf-server-v4/node_modules/hsf-server');
    });

    it('should get false when deepth is too large', function() {
      const origin = '/pandora-shimmer-test/a/b/c/d/e/f/g/h/j/k/l/m/n/o/p/index.js';
      const base = moduleHook['findBasePath']('pandora-shimmer-test', origin);

      expect(base).to.be.false;
    });
  });

  describe('getModuleInfo', function() {

    it('should get info', function() {
      const module = require.resolve('chai');
      const base = moduleHook['findBasePath']('chai', module);
      const info = moduleHook['getModuleInfo'](base);

      expect(info).to.be.exist;
    });

    it('should get null, because package.json was not found', function() {
      const info = moduleHook['getModuleInfo'](__dirname);

      expect(info).not.to.be.exist;
    });

    it('should get null, because package.json is illegal json', function() {
      const base = path.join(__dirname, '../fixtures');
      const info = moduleHook['getModuleInfo'](base);

      expect(info).not.to.be.exist;
    });

    it('shoule get null, because base path is null', function() {
      const info = moduleHook['getModuleInfo'](null);

      expect(info).not.to.be.exist;
    });

  });

  describe('register', function() {

    it('should register module', function() {
      moduleHook.register('test', '0.0.1', function() { return 'test@0.0.1'; });
      const versions = moduleHook.handlers.get('test');

      expect(versions).to.be.exist;
      expect(versions.get('0.0.1')).to.be.exist;
    });

    it('should register same module with different version', function() {
      moduleHook.register('test', '0.0.2', function() { return 'test@0.0.2'; });
      const versions = moduleHook.handlers.get('test');

      expect(versions).to.be.exist;
      expect(versions.get('0.0.2')).to.be.exist;
    });

    it('should not register same module, because same version', function() {
      moduleHook.register('test', '0.0.2', function() { return 'test@0.0.3'; });
      const versions = moduleHook.handlers.get('test');
      const handler = versions.get('0.0.2');

      expect(handler()).to.equal('test@0.0.2');
    });
  });

  describe('registerSourceReplacer', function() {

    it('should register source replacer', function () {
      moduleHook['registerSourceReplacer']('/test', function() { return 'test'; });

      expect(moduleHook.sourceReplacer.get('/test')).to.be.exist;
    });

    it('should not register source replacer, because same filepath', function () {
      moduleHook['registerSourceReplacer']('/test', function() { return 'test-new'; });
      const replacer = moduleHook.sourceReplacer.get('/test');

      expect(replacer()).to.equal('test');
    });
  });

});