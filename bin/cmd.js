const chalk = require('chalk')
const extOs = require('yyl-os')
const print = require('yyl-print')
const LANG = require('../lang/index')
const vars = require('../lib/vars')

const events = {
  help({ env }) {
    const h = {
      usage: 'yyl',
      commands: {
        'init': LANG.CMD.HELP.COMMANDS.INIT,
        'watch,w,d,r': LANG.CMD.HELP.COMMANDS.WATCH,
        'all,o': LANG.CMD.HELP.COMMANDS.ALL,
        'install': LANG.CMD.HELP.COMMANDS.INSTALL,
        'server': LANG.CMD.HELP.COMMANDS.SERVER
      },
      options: {
        '--help': LANG.CMD.HELP.OPTIONS.HELP,
        '-v, --version': LANG.CMD.HELP.OPTIONS.VERSION,
        '-p, --path': LANG.CMD.HELP.OPTIONS.PATH
      }
    }
    if (!env.silent) {
      print.help(h)
    }
    return Promise.resolve(h)
  },
  path({ env, logger }) {
    if (!env.silent) {
      logger.log('msg', [
        'success',
        `path: ${chalk.yellow.bold(vars.BASE_PATH)}`
      ])
      extOs.openPath(vars.BASE_PATH)
    }
    return Promise.resolve(vars.BASE_PATH)
  }
}

async function command({
  env = {},
  shortEnv = {},
  cmds = [],
  logger,
  context
}) {
  if (!logger) {
    logger = {
      log() {},
      setProgress() {}
    }
  }
  if (!context) {
    context = process.cwd()
  }

  if (!cmds.length) {
    // 根命令
    if (env.help || shortEnv.h) {
      // 显示帮助信息
      return events.help({ env, logger })
    } else if (env.path || env.p) {
      // 显示 yyl 所在路径
      return events.path({ env, logger })
    } else if (env.version || shortEnv.v) {
      // 显示 yyl 版本
      return require('../tasks/version')({ env })
    }
  } else {
    switch (cmds[0]) {
      // yyl 项目初始化
      case 'init':
        return require('../tasks/init')({ env })

      // seed 安装
      case 'i':
      case 'install':
        return require('../tasks/install')({ cmds: cmds.slice(1), env })

      // server 相关命令
      case 'server':
        return require('../tasks/server')({
          context,
          env,
          cmds: cmds.slice(1),
          shortEnv,
          logger
        })

      // 构建相关命令
      case 'w':
      case 'd':
      case 'o':
      case 'r':
      case 'all':
      case 'watch':
        return require('../tasks/optimize')({
          env,
          context,
          logger,
          cmds: cmds.slice(1)
        })

      default:
        return events.help({ env, logger })
    }
  }
}

module.exports = command
