'use strict';
const path = require('path');
const childProcess = require('child_process');
const fork = function(name, done) {
  const worker = childProcess.fork(path.join(__dirname, `../fixtures/${name}.ts`), {
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
    execArgv: [
      '-r', 'ts-node/register',
      '-r', 'nyc-ts-patch'
    ]
  });

  worker.on('message', (data) => {
    if (data === 'done') {
      done();
    }
  });
};

describe('test/index.test.ts', () => {
  it('should loadModule work ok', done => {
    fork('loadModule', done);
  });

  it('should replaceSource work ok', done => {
    fork('replaceSource', done);
  });

  it('should replaceSource work ok', done => {
    fork('replaceWithFile', done);
  });

  it('run doHook error', done => {
    fork('hookRunError', done);
  });

  it('replacer file missing', done => {
    fork('replacerFileMissing', done);
  });

  it('run same hook again', done => {
    fork('runSameHookAgain', done);
  });

  it('should replace source once', done => {
    fork('replaceOnlyOnce', done);
  });

  it('should work with two ways', done => {
    fork('useTwoWays', done);
  });
});