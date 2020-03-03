'use strict'
const util = require('yyl-util')
const chalk = require('chalk')

const log = require('../lib/log.js')
const vars = require('../lib/vars.js')
const Hander = require('yyl-hander')
const yh = new Hander({ vars, log })
const LANG = require('../lang/index')

const info = {
  printInformation: function(config, silent) {
    const r = {}
    r[LANG.INFO.DETAIL.NAME] = config.name
    r[LANG.INFO.DETAIL.WORKFLOW] = config.workflow
    r[LANG.INFO.DETAIL.BUILD_VERSION] = config.version
    r[LANG.INFO.DETAIL.PLATFORM] = config.platform
    r[LANG.INFO.DETAIL.PROXY] = (function() {
      if (config.proxy) {
        var keys = Object.keys(config.proxy.localRemote)
        if (keys.length) {
          return keys
        } else {
          return []
        }
      } else {
        return []
      }
    })()

    const rArgv = []
    Object.keys(r).forEach((key) => {
      let str = `${chalk.yellow(key)}: `
      if (util.type(r[key]) === 'array') {
        str = `${str}${r[key].map((t) => chalk.cyan(t)).join(chalk.gray(', '))}`
      } else {
        str = `${str}${chalk.cyan(r[key])}`
      }
      rArgv.push(str)
    })
    if (!silent) {
      log('msg', 'success', rArgv)
    }
    return r
  },
  async init(iEnv, configPath) {
    const config = await yh.parseConfig(configPath, iEnv)
    let r = null
    let isWork = false

    if ('workflow' in config) {
      r = info.printInformation(config, iEnv.silent)
      isWork = true
    } else {
      Object.keys(config).forEach((key) => {
        if ('workflow' in config[key]) {
          r = info.printInformation(config[key], iEnv.silent)
          isWork = true
        }
      })
    }

    if (!isWork) {
      log('msg', 'warn', LANG.INFO.READ_ERROR)
      return null
    } else {
      return r
    }
  },
  async run(iEnv, configPath) {
    return await info.init(iEnv, configPath)
  }
}

module.exports = info
