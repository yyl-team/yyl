'use strict'
const path = require('path')
const extFs = require('yyl-fs')
const util = require('yyl-util')
const extOs = require('yyl-os')
const Hander = require('yyl-hander')
const chalk = require('chalk')

const vars = require('../lib/vars.js')
const log = require('../lib/log.js')

const wSeed = require('./seed.js')
const PKG = require('../package.json')

const yh = new Hander({ vars, log })

const LANG = require('../lang/index')

const wOpzer = async function (ctx, iEnv, configPath) {
  yh.setVars(vars)

  // env format
  if (iEnv.ver == 'remote') {
    iEnv.remote = true
  }
  if (iEnv.remote) {
    iEnv.ver = 'remote'
  }

  log('msg', 'info', LANG.OPTIMIZE.PARSE_CONFIG_START)

  // init config
  let config
  try {
    config = await yh.parseConfig(configPath, iEnv)
  } catch (er) {
    throw new Error(`${LANG.OPTIMIZE.PARSE_CONFIG_ERROR}: ${er}`)
  }

  if (config.workflow === 'webpack-vue2') {
    config.workflow = 'webpack'
    config.seed = 'vue2'
  }

  yh.optimize.init({ config, iEnv })
  yh.optimize.saveConfigToServer()

  // 版本检查
  if (util.compareVersion(config.version, PKG.version) > 0) {
    throw new Error(
      `${LANG.OPTIMIZE.REQUIRE_ATLEAST_VERSION} ${config.version}`
    )
  }

  const seed = wSeed.find(config)
  if (!seed) {
    throw new Error(
      `${LANG.OPTIMIZE.WORKFLOW_NOT_FOUND}: (${config.workflow}), usage: ${wSeed.workflows}`
    )
  }

  // yarn 安装检查
  if (config.yarn) {
    const yarnVersion = await extOs.getYarnVersion()
    if (yarnVersion) {
      log(
        'msg',
        'info',
        `${LANG.OPTIMIZE.YARN_VERSION}: ${chalk.green(yarnVersion)}`
      )
    } else {
      throw new Error(
        `${LANG.OPTIMIZE.INSTALL_YARN}: ${chalk.yellow('npm i yarn -g')}`
      )
    }
  }

  const opzer = await seed.optimize({
    config,
    iEnv,
    ctx,
    root: path.dirname(configPath)
  })

  // handle exists check
  if (!opzer[ctx] || util.type(opzer[ctx]) !== 'function') {
    throw new Error(`${LANG.OPTIMIZE.WORKFLOW_OPTI_HANDLE_NOT_EXISTS}: ${ctx}`)
  }

  // package check
  try {
    await yh.optimize.initPlugins()
  } catch (er) {
    if (iEnv.logLevel === 2) {
      throw new Error(er)
    } else {
      throw new Error(`${LANG.OPTIMIZE.PLUGINS_INSTALL_FAIL}: ${er.message}`)
    }
  }

  // clean dist
  await extFs.removeFiles(config.localserver.root)

  const IS_WATCH = ctx === 'watch'

  if (IS_WATCH) {
    const wServer = require('./server.js')
    const op = {
      livereload: opzer.ignoreLiveReload && !iEnv.livereload ? false : true,
      ignoreServer: opzer.ignoreServer
    }

    let afterConfig = await wServer.start(config, iEnv, op, {
      appWillMount: opzer.appWillMount
    })
    if (afterConfig) {
      config = afterConfig
    }
  }

  // optimize
  return new Promise((next, reject) => {
    let isUpdate = 0
    let isError = false
    const htmlSet = new Set()
    opzer
      .on('start', () => {
        if (isUpdate) {
          log('clear')
          log('start', 'optimize')
        }
      })
      .on('msg', (type, ...argv) => {
        log('msg', type, argv)
        if (type === 'error') {
          isError = argv
        }
        if (['create', 'update'].indexOf(type) !== -1) {
          if (/\.html$/.test(argv[0])) {
            htmlSet.add(argv[0])
          }
        }
      })
      .on('loading', (name) => {
        log('loading', name)
      })
      .on('finished', async () => {
        if (!IS_WATCH && isError) {
          return reject(isError)
        }
        log('msg', 'success', [`${ctx} ${LANG.OPTIMIZE.TASK_RUN_FINSHED}`])

        const homePage = await yh.optimize.getHomePage({
          files: (() => {
            const r = []
            htmlSet.forEach((item) => {
              r.push(item)
            })
            return r
          })()
        })
        log('msg', 'success', [
          `${LANG.OPTIMIZE.PRINT_HOME_PAGE}: ${chalk.yellow.bold(homePage)}`
        ])
        // 第一次构建 打开 对应页面
        if (IS_WATCH && !isUpdate && !iEnv.silent && iEnv.proxy) {
          extOs.openBrowser(homePage)
        }

        if (isUpdate) {
          // 刷新页面
          if (!opzer.ignoreLiveReload || iEnv.livereload) {
            log('msg', 'success', LANG.OPTIMIZE.PAGE_RELOAD)
            await yh.optimize.livereload()
          }
          log('finished')
        } else {
          isUpdate = 1
          log('finished')
          next(config, opzer)
        }
      })
      [ctx](iEnv)
  })
}

module.exports = wOpzer
