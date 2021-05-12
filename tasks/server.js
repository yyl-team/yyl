'use strict'
const chalk = require('chalk')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const print = require('yyl-print')

const vars = require('../lib/vars.js')

const LANG = require('../lang/index')

const wServer = ({ context, env, cmds, shortEnv, logger }) => {
  if (!cmds.length) {
    if (env.help || shortEnv.h) {
      // 显示帮助信息
      return wServer.help({ env })
    } else if (env.path || shortEnv.p) {
      // 显示 server 目录
      return wServer.path({ env, logger })
    }
  } else {
    switch (cmds[0]) {
      // 启动服务
      case 'start':
        return wServer.start({ context, env, logger })

      // 服务相关缓存清理
      case 'clear':
      case 'clean':
        return wServer.clear({ logger })

      default:
        return wServer.help({ env, logger })
    }
  }
  return Promise.resolve(undefined)
}

// 帮助
wServer.help = ({ env }) => {
  let h = {
    usage: 'yyl server',
    commands: {
      start: LANG.SERVER.HELP.COMMANDS.START,
      clear: LANG.SERVER.HELP.COMMANDS.CLEAR
    },
    options: {
      '--help': LANG.SERVER.HELP.OPTIONS.HELP,
      '-p, --path': LANG.SERVER.HELP.OPTIONS.PATH
    }
  }
  if (!env.silent) {
    print.help(h)
  }
  return Promise.resolve(h)
}

// 路径
wServer.path = ({ env, logger }) => {
  if (!env.silent) {
    logger('msg', ['success', `path: ${chalk.yellow.bold(vars.SERVER_PATH)}`])
    extOs.openPath(vars.SERVER_PATH)
  }
  return Promise.resolve(vars.SERVER_PATH)
}

// 启动服务器
wServer.start = async function () {
  // TODO:
}

wServer.clear = async function ({ logger }) {
  logger.setProgress('start', ['info', [LANG.SERVER.CLEAN_START]])
  const list = await extFs.removeFiles(vars.SERVER_PATH)
  list.forEach((iPath) => {
    logger('msg', ['del', [iPath]])
  })
  logger.setProgress('finished', ['success', [LANG.SERVER.CLEAN_FINISHED]])
}

module.exports = wServer
