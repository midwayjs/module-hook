'use strict';
const path = require('path');
const childProcess = require('child_process');
const fork = function(name, done) {
  const worker = childProcess.fork(path.join(__dirname, `support/${name}`));
  worker.on('message', (data) => {
    if (data === 'done') {
      done();
    }
  });
}

describe('test/index.test.js', () => {
  it('should loadModule work ok', done => {
    fork('demo', done);
  });

  it('should replaceSource work ok', done => {
    fork('demo1', done);
  });
});