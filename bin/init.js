#!/usr/bin/env node
const domain = require('domain');
const myArgv = process.argv.splice(2);
const path = require('path');
const d = domain.create();

d.on('error', (err) => {
  console.error('domain error catch\n', err.stack);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:\n', err.stack);
});

d.run(() => {
  require(path.join(__dirname, '../tasks/w-cmd')).apply(global, myArgv);
});


