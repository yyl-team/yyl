#!/usr/bin/env node
const domain = require('domain');
const iArgv = process.argv.splice(2);
const d = domain.create();

d.on('error', (err) => {
  console.error('domain error catch\n', err.stack);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:\n', err.stack);
});

d.run(async () => {
  const wCmd = require('../tasks/w-cmd.js');
  if (iArgv[0] === 'all') {
    await wCmd(...iArgv);
  } else {
    try {
      await wCmd(...iArgv);
    } catch (er) {
      process.exit(1);
    }
  }
});


