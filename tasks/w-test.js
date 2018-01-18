'use strict';

// var fs = require('fs');

var wTest = function() {
  var file = '';
  var args = '';
  var command = 'yyl -p';

  if (process.platform === 'win32') {
    file = 'cmd.exe';
    args = ['/s', '/c', command];
  } else {
    file = '/bin/sh';
    args = ['-c', command];
  }

  var iSpawn = require('child_process').spawn;
  var cwd = process.cwd();
  var PROJECT_PATH = process.cwd();
  var child;

  child = iSpawn(file, args, {
    cwd: cwd,
    silent: false,
    stdio: [0, 1, 2]
  });
  child.on('exit', () => {
    process.chdir(PROJECT_PATH);
  });
};

module.exports = wTest;
