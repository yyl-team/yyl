#!/usr/bin/env node
const chalk = require('chalk')
const util = require('yyl-util')
const { YylCmdLogger, cleanScreen } = require('yyl-cmd-logger')
const command = require('./cmd')

const logger = new YylCmdLogger({
  lite: true,
  type: {
    yyl: {
      name: 'YYL>',
      color: chalk.white.bgBlack.bold,
      shortName: '>',
      shortColor: chalk.cyan
    }
  }
})

process.on('uncaughtException', (err) => {
  logger.log('error', ['Uncaught exception:\n', err])
})
;(async () => {
  cleanScreen()
  const { env, cmds, shortEnv } = util.cmdParse(process.argv)
  // log 日志等级
  if (env.silent) {
    logger.setLogLevel(0)
  } else if (env.logLevel || env.logLevel === 0) {
    logger.setLogLevel(env.logLevel)
  }

  const handleErr = function (er) {
    logger.log('error', [er])
    // eslint-disable-next-line no-process-exit
    process.exit(1)
  }
  await command({
    env,
    cmds,
    shortEnv,
    logger,
    context: process.cwd()
  }).catch((er) => {
    handleErr(er)
  })
})()
