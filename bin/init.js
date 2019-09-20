#!/usr/bin/env node
const log = require('../lib/log.js');
const iArgv = process.argv.splice(2);


process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:\n', err.stack);
});

(async () => {
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
})();


