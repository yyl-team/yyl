#!/usr/bin/env node
const log = require('../lib/log.js')
const iArgv = process.argv.splice(2)
const util = require('yyl-util')

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:\n', err.stack)
})
;(async () => {
  const wCmd = require('../tasks/cmd.js')
  const { env } = util.cmdParse(process.argv)
  const handleErr = function (er) {
    if (env.logLevel === 2) {
      log('msg', 'error', er)
    } else {
      log('msg', 'error', er.message)
    }
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }
  try {
    await wCmd(...iArgv).catch((er) => {
      handleErr(er)
    })
  } catch (er) {
    handleErr(er)
  }
})()
