#!/usr/bin/env node
const domain = require('domain');
const myArgv = process.argv.splice(2);
const d = domain.create();

d.on('error', (err) => {
  console.error('domain error catch\n', err.stack);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:\n', err.stack);
});

d.run(() => {
  const wCmd = require('../tasks/w-cmd.js');
  wCmd(...myArgv).catch((er) => {});
});


