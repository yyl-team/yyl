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
        init: LANG.CMD.HELP.COMMANDS.INIT,
        info: LANG.CMD.HELP.COMMANDS.INFO,
        server: LANG.CMD.HELP.COMMANDS.SERVER
      },
      options: {
        '--help': LANG.CMD.HELP.OPTIONS.HELP,
        '-v, --version': LANG.CMD.HELP.OPTIONS.VERSION,
        '-p, --path': LANG.CMD.HELP.OPTIONS.PATH,
        '--logLevel': LANG.CMD.HELP.OPTIONS.LOG_LEVEL,
        '--config': LANG.CMD.HELP.OPTIONS.CONFIG
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

async function command({ env, shortEnv, cmds, logger, context }) {
  console.log(env, shortEnv, cmds)
  if (!cmds.length) {
    // 根命令
    if (env.help || shortEnv.h) {
      // 显示帮助信息
      events.help({ env, logger })
    } else if (env.path || env.p) {
      // 显示 yyl 所在路径
      events.path({ env, logger })
    } else if (env.version || shortEnv.v) {
      // 显示 yyl 版本
      require('../tasks/version')({ env })
    }
  } else {
    switch (cmds[0]) {
      // yyl 项目初始化
      case 'init':
        // TODO:
        break
      // seed 安装
      case 'i':
      case 'install':
        // TODO:
        break
      // server 相关命令
      case 'server':
        // TODO:
        break

      // 构建相关命令
      case 'w':
      case 'd':
      case 'o':
      case 'r':
      case 'all':
      case 'watch':
        require('../tasks/optimize')({ env, context, logger })
        // TODO: 先校验 yyl 配置是否存在
        break
    }
  }
}

module.exports = command
