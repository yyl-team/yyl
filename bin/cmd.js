const chalk = require('chalk')
const extOs = require('yyl-os')
const print = require('yyl-print')
const LANG = {
  CMD: {
    HELP: {
      COMMANDS: {
        INIT: '初始化',
        SERVER: '服务器相关命令',
        SEED: 'seed 包相关命令',
        WATCH: '项目构建并启动相关服务',
        ALL: '项目打包'
      },
      OPTIONS: {
        HELP: '显示帮助信息',
        VERSION: '显示版本',
        PATH: '显示 yyl 所在路径',
        LOG_LEVEL: '设置 logLevel: 0|1|2',
        CONFIG: '设置 yyl 配置路径'
      }
    }
  },
  PATH: {
    YYL_PATH: 'yyl 项目所在路径',
    YYL_CONDIG_PATH: 'yyl 配置所在路径'
  }
}
const vars = require('../lib/const')

const events = {
  help({ env }) {
    const h = {
      usage: 'yyl',
      commands: {
        'init': LANG.CMD.HELP.COMMANDS.INIT,
        'watch,w,d,r': LANG.CMD.HELP.COMMANDS.WATCH,
        'all,o': LANG.CMD.HELP.COMMANDS.ALL,
        'seed': LANG.CMD.HELP.COMMANDS.SEED
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
      logger.log('info', [
        `${LANG.PATH.YYL_PATH}: ${chalk.yellow.bold(vars.BASE_PATH)}`
      ])

      logger.log('info', [
        `${LANG.PATH.YYL_CONDIG_PATH}: ${chalk.yellow.bold(vars.SERVER_PATH)}`
      ])
      extOs.openPath(vars.BASE_PATH)
      extOs.openPath(vars.SERVER_PATH)
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
    } else if (env.path || shortEnv.p) {
      // 显示 yyl 所在路径
      return events.path({ env, logger })
    } else if (env.version || shortEnv.v) {
      // 显示 yyl 版本
      return require('../tasks/version')({ env })
    } else {
      // 显示帮助信息
      return events.help({ env, logger })
    }
  } else {
    switch (cmds[0]) {
      // yyl 项目初始化
      case 'init':
        return require('../tasks/init')({ env, context, logger })

      // seed
      case 'seed':
        return require('../tasks/seed')({
          cmds: cmds.slice(1),
          env,
          logger,
          shortEnv
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
          shortEnv,
          context,
          logger,
          cmds
        })

      default:
        return events.help({ env, logger })
    }
  }
}

module.exports = command
