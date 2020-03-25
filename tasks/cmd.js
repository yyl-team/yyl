'use strict'
const chalk = require('chalk')
const fs = require('fs')
const print = require('yyl-print')
const util = require('yyl-util')
const extOs = require('yyl-os')

const wSeed = require('./seed.js')
const vars = require('../lib/vars.js')
const log = require('../lib/log.js')
const pkg = require('../package.json')
const LANG = require('../lang/index')

const events = {
  help(iEnv, opzerHandles) {
    const h = {
      usage: 'yyl',
      commands: {
        'init': LANG.CMD.HELP.COMMANDS.INIT,
        'info': LANG.CMD.HELP.COMMANDS.INFO,
        'server': LANG.CMD.HELP.COMMANDS.SERVER
      },
      options: {
        '--help': LANG.CMD.HELP.OPTIONS.HELP,
        '-v, --version': LANG.CMD.HELP.OPTIONS.VERSION,
        '-p, --path': LANG.CMD.HELP.OPTIONS.PATH,
        '--logLevel': LANG.CMD.HELP.OPTIONS.LOG_LEVEL,
        '--config': LANG.CMD.HELP.OPTIONS.CONFIG
      }
    }
    opzerHandles.forEach((key) => {
      h.commands[key] = 'optimize'
    })
    if (!iEnv || !iEnv.silent) {
      print.help(h)
    }
    return Promise.resolve(h)
  },
  path(iEnv) {
    if (!iEnv.silent) {
      log('msg', 'success', `path: ${chalk.yellow.bold(vars.BASE_PATH)}`)
      extOs.openPath(vars.BASE_PATH)
    }
    return Promise.resolve(vars.BASE_PATH)
  }
}

module.exports = async function(ctx) {
  let iArgv = util.makeArray(arguments)
  const iEnv = util.envParse(arguments)
  let type = ''


  let configPath
  if (iEnv.config) {
    configPath = util.path.resolve(vars.PROJECT_PATH, iEnv.config)
  } else {
    configPath = util.path.resolve(vars.PROJECT_PATH, 'yyl.config.js')
    if (!fs.existsSync(configPath)) {
      configPath = util.path.resolve(vars.PROJECT_PATH, 'config.js')
    }
  }

  const opzerHandles = wSeed.getHandles(configPath, iEnv) || []

  if (!isNaN(iEnv.logLevel) && iEnv.logLevel !== true) {
    require('./server.js').setLogLevel(iEnv.logLevel, true, true)
  }

  if (iEnv.silent) {
    require('./server.js').setLogLevel(0, true, true)
  }



  // optimize
  let handle = null
  let argv = []
  if (~opzerHandles.indexOf(ctx)) {
    handle = require('./optimize.js')
    // 缩写句柄处理
    if (ctx === 'o') {
      ctx = 'all'
      iEnv.isCommit = true
      iArgv = ['all'].concat(util.envStringify(iEnv).split(' '))
    } else if (ctx === 'd') {
      ctx = 'watch'
      iEnv.proxy = true
      iEnv.hmr = true
      iEnv.tips = true
      iArgv = ['watch'].concat(util.envStringify(iEnv).split(' '))
    } else if (ctx === 'r') {
      ctx = 'watch'
      iEnv.proxy = true
      iEnv.remote = true
      iEnv.hmr = true
      iEnv.tips = true
      iArgv = ['watch'].concat(util.envStringify(iEnv).split(' '))
    } else if (ctx === 'w') {
      ctx = 'watch'
      iArgv[0] = 'watch'
    }

    argv = [ctx, iEnv, configPath]
    type = 'optimize'
  } else {
    switch (ctx) {
      case '-v':
      case '--version':
        handle = require('./version.js')
        argv = [iEnv]
        type = ''
        break

      case '--logLevel':
        if (iArgv[1]) {
          handle = require('./server.js').setLogLevel
          argv = [iArgv[1]]
        } else {
          handle = require('./server.js').getLogLevel
          argv = []
        }
        type = 'Info'
        break

      case '-h':
      case '--help':
        handle = events.help
        argv = [iEnv, opzerHandles]
        type = ''
        break

      case '--path':
      case '-p':
        handle = events.path
        argv = [iEnv]
        type = 'Info'
        break

      case 'init':
        handle = require('./init.js')
        if (iEnv.help) {
          handle = handle.help
        }

        type = 'init'
        argv = [iEnv]
        break

      case 'server':
        handle = require('./server.js')
        argv = [iArgv[1], iEnv, configPath]
        type = 'server'
        if (iEnv.help) {
          type = ''
        }
        break

      case 'rm':
        handle = require('./remove.js')
        argv = [iArgv[1]]
        type = 'remove'
        break

      case 'profile':
        handle = require('./profile.js').print
        argv = []
        type = 'Info'
        break

      case 'info':
        handle = require('./info.js').run
        argv = [iEnv, configPath]
        type = 'Info'
        break

      default:
        handle = events.help
        argv = [iEnv, opzerHandles]
        type = ''
        break
    }
  }
  if (type) {
    log('clear')
    log('msg', 'yyl', `${chalk.yellow.bold(pkg.version)}`)
    log('msg', 'cmd', `yyl ${iArgv.join(' ')}`)
    log('start', type, `${type} ${LANG.CMD.TASK_START}`)
  }

  let r

  // eslint-disable-next-line no-useless-catch
  try {
    r = await handle(...argv)
  } catch (er) {
    throw new Error(er)
  }

  if (type) {
    log('msg', 'info', `${type} ${LANG.CMD.TASK_FINSHED}`)
    log('finished', `${type} ${LANG.CMD.TASK_FINSHED}`)
  }


  return r
}
