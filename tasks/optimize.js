const { printHelp, cleanScreen } = require('yyl-cmd-logger')
const { printHeader } = require('../lib/util')
const chalk = require('chalk')
const seed = require('./seed')
const { YylHander } = require('yyl-hander')
const Lang = {
  Help: {
    Help: '显示帮助信息',
    Watch: '构建并监听文件',
    All: '构建文件',
    O: '构建并压缩文件， 等同 yyl all --isCommit --doctor',
    D: '构建并监听文件, 等同 yyl watch --proxy --tips --hmr --doctor',
    W: '构建并监听文件， 等同 yyl watch --doctor',
    R: '构建监听文件,并映射线上 rev-map, 等同 yyl d --remote',
    IsCommit: '压缩文件',
    Hmr: '激活热更新',
    Tips: '引入本地调试标识',
    Proxy: '启动反向代理',
    Https: '启动 https 代理',
    Remote: '映射线上 menifest',
    Open: '自动打开网页',
    Doctor: '自动检查并更新 seed 包版本'
  },
  WorkflowNotMatch: 'config.workflow 错误',
  OptimizeStart: '正在构建项目'
}
async function optimize({ cmds, context, logger, env, shortEnv }) {
  if (env.help || shortEnv.h) {
    return optimize.help({
      cmds,
      env
    })
  } else {
    // 简写复原
    if (cmds[0] === 'w') {
      cmds[0] = 'watch'
      env = {
        doctor: true,
        ...env
      }
    } else if (cmds[0] === 'o') {
      cmds[0] = 'all'
      env = {
        isCommit: true,
        doctor: true,
        ...env
      }
    } else if (cmds[0] === 'd') {
      cmds[0] = 'watch'
      env = {
        proxy: true,
        tips: true,
        hmr: true,
        open: true,
        doctor: true,
        ...env
      }
    } else if (cmds[0] === 'r') {
      cmds[0] = 'watch'
      env = {
        proxy: true,
        tips: true,
        hmr: true,
        remote: true,
        doctor: true,
        ...env
      }
    }

    printHeader({
      logger,
      cmds,
      env,
      shortEnv
    })

    // 初始化 handler
    const yylHander = new YylHander({
      context,
      env,
      logger(type, $1, $2, $3) {
        if (type === 'msg') {
          logger.log($1, $2)
        } else if (type === 'progress') {
          logger.setProgress($1, $2, $3)
        } else if (type === 'cleanScreen') {
          cleanScreen()
        }
      }
    })

    const yylConfig = yylHander.getYylConfig()
    let seedName = ''
    switch (yylConfig.workflow) {
      case 'webpack':
        seedName = 'yyl-seed-webpack'
        break
      case 'gulp-requirejs':
        seedName = 'yyl-seed-gulp-requirejs'
        break
      case 'other':
        seedName = 'yyl-seed-other'
        break
      default:
        break
    }
    if (!seedName) {
      throw new Error(
        `${Lang.WorkflowNotMatch}: ${chalk.red(
          yylConfig.workflow
        )} (${chalk.yellow('webpack | gulp-requirejs | other')})`
      )
    }

    // 获取 seed
    const iSeed = await seed.get({
      name: seedName,
      logger,
      env
    })
    await yylHander.init({
      seed: iSeed,
      watch: cmds[0] === 'watch'
    })
    return yylConfig
  }
}

optimize.help = ({ cmds, env }) => {
  const h = {
    usage: 'yyl',
    commands: {
      watch: Lang.Help.Watch,
      all: Lang.Help.All,
      d: Lang.Help.D,
      r: Lang.Help.R,
      w: Lang.Help.W,
      o: Lang.Help.O
    },
    options: {
      '--proxy': Lang.Help.Proxy,
      '--tips': Lang.Help.Tips,
      '--hmr': Lang.Help.Hmr,
      '--open': Lang.Help.Open,
      '--remote': Lang.Help.Remote,
      '--https': Lang.Help.Https,
      '--isCommit': Lang.Help.IsCommit,
      '--doctor': Lang.Help.Doctor,
      '-h, --help': Lang.Help.Help
    }
  }

  switch (cmds[0]) {
    case 'watch':
    case 'all':
    case 'd':
    case 'r':
    case 'w':
    case 'o':
      h.usage = `yyl ${cmds[0]}`
      h.desc = h.commands[cmds[0]]
      delete h.commands
      break

    default:
      break
  }

  if (!env.silent) {
    printHelp(h)
  }
  return Promise.resolve(h)
}

module.exports = optimize
