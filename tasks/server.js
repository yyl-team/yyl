'use strict'
const path = require('path')
const chalk = require('chalk')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const util = require('yyl-util')
const print = require('yyl-print')

const vars = require('../lib/vars.js')
const log = require('../lib/log.js')
const Hander = require('yyl-hander')
const { Runner } = require('yyl-server')
const yh = new Hander({ vars, log })

const wProfile = require('./profile.js')
const LANG = require('../lang/index')

const cache = {
  runner: null
}

const wServer = (ctx, iEnv, configPath) => {
  const she = wServer
  switch (ctx) {
  case '--path':
  case '-p':
    return she.path(iEnv)

  case 'start':
    return (async () => {
      let config
      config = await she.start(configPath, iEnv)
      return config
    })()

  case 'abort':
    return she.abort(iEnv)

  case 'clear':
  case 'clean':
    return she.clear()

  case '--help':
    return she.help(iEnv)

  default:
    return she.help(iEnv)
  }
}

// 帮助
wServer.help = (iEnv) => {
  let h = {
    usage: 'yyl server',
    commands: {
      'start': LANG.SERVER.HELP.COMMANDS.START,
      'abort': LANG.SERVER.HELP.COMMANDS.ABORT,
      'clear': LANG.SERVER.HELP.COMMANDS.CLEAR
    },
    options: {
      '--help': LANG.SERVER.HELP.OPTIONS.HELP,
      '-p, --path': LANG.SERVER.HELP.OPTIONS.PATH
    }
  }
  if (!iEnv.silent) {
    print.help(h)
  }
  return Promise.resolve(h)
}

// 路径
wServer.path = (iEnv) => {
  if (!iEnv.silent) {
    log('msg', 'success', `path: ${chalk.yellow.bold(vars.SERVER_PATH)}`)
    extOs.openPath(vars.SERVER_PATH)
  }
  return Promise.resolve(vars.SERVER_PATH)
}

// 启动服务器
wServer.start = async function (ctx, iEnv, options, serverOption) {
  if (iEnv.help) {
    let h = {
      usage: 'yyl server start',
      options: {
        '--help': LANG.SERVER_START.HELP.OPTIONS.HELP,
        '--path <dir>': LANG.SERVER_START.HELP.OPTIONS.PATH,
        '--port <dir>': LANG.SERVER_START.HELP.OPTIONS.PORT,
        '--proxy': LANG.SERVER_START.HELP.OPTIONS.PROXY,
        '--https': LANG.SERVER_START.HELP.OPTIONS.HTTPS,
        '--proxy <port>': LANG.SERVER_START.HELP.OPTIONS.PROXY_PORT
      }
    }
    if (!iEnv.silent) {
      print.help(h)
    }
    return
  }

  const DEFAULT_CONFIG = {
    port: 5000,
    root: vars.PROJECT_PATH,
    lrPort: 50001,
    entry: undefined
  }

  const op = options || {}

  // init config
  let config
  if (typeof ctx === 'object') {
    config = ctx
    config.localserver = util.extend(DEFAULT_CONFIG, config.localserver)
  } else {
    try {
      config = await yh.parseConfig(ctx, iEnv, ['localserver', 'proxy', 'commit'])
    } catch (er) {
      config = {
        localserver: DEFAULT_CONFIG
      }
      log('msg', 'warn', er)
      log('msg', 'warn', LANG.SERVER.USE_DEFAULT_CONFIG)
    }
  }

  cache.runner = new Runner({
    config,
    env: iEnv,
    log(type, argu) {
      log('msg', type, ...argu)
    },
    ignoreServer: op.ignoreServer,
    serverOption,
    cwd: iEnv.config ? path.dirname(iEnv.config) : vars.PROJECT_PATH
  })

  await cache.runner.start()

  config = cache.runner.config

  const { app } = cache.runner

  if (typeof op.onInitMiddleWare === 'function') {
    await op.onInitMiddleWare(app, config.localserver.port)
  }

  return config
}

wServer.abort = async function() {
  if (cache.runner) {
    await cache.runner.abort()
  }
}

wServer.clear = async function() {
  log('clear')
  log('start', 'server', LANG.SERVER.CLEAN_START)
  const list = await extFs.removeFiles(vars.SERVER_PATH)
  list.forEach((iPath) => {
    log('msg', 'del', iPath)
  })
  await Runner.clean()
  log('finish', LANG.SERVER.CLEAN_FINISHED)
}

wServer.setLogLevel = function(level, notSave, silent) {
  if (!notSave) {
    wProfile('logLevel', level)
  }
  log.update(level)
  if (!silent) {
    log('msg', 'success', `${LANG.SERVER.CHANGE_LOG_LEVEL}: ${chalk.yellow.bold(level)}`)
  }
  return Promise.resolve(level)
}
wServer.getLogLevel = function(silent) {
  const level = wProfile('logLevel') ||  1
  log.update(+level)
  if (!silent) {
    // eslint-disable-next-line no-console
    console.log([
      '',
      ` ${chalk.yellow.bold('logLevel')}: ${chalk.yellow(level)}`,
      ''
    ].join('\n'))
  }
  return Promise.resolve(level)
}

module.exports = wServer
