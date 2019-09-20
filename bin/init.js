#!/usr/bin/env node
const domain = require('domain');
const log = require('../lib/log.js');
const iArgv = process.argv.splice(2);
const d = domain.create();

d.on('error', (err) => {
  let r = err;
  // if (typeof err === 'string') {
  //   r = err;
  // } else {
  //   r = err;
  // }
  console.error('domain error catch\n', r);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:\n', err.stack);
});

d.run(async () => {
  const wCmd = require('../tasks/w-cmd.js');
  if (iArgv[0] === 'all') {
    try {
      await wCmd(...iArgv);
    } catch (er) {
      log('msg', 'error', er);
      process.exit(1);
    }
  } else {
    try {
      await wCmd(...iArgv);
    } catch (er) {
      log('msg', 'error', er);
      process.exit(1);
    }
  }
});


