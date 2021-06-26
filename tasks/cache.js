const { printHelp } = require('yyl-cmd-logger')
const chalk = require('chalk')
const inquirer = require('inquirer')
const fs = require('fs')
const extFs = require('yyl-fs')
const util = require('yyl-util')

const USERPROFILE =
  process.env[process.platform === 'win32' ? 'USERPROFILE' : 'HOME'] || ''
const PROXY_CACHE_PATH = util.path.join(USERPROFILE, '.anyproxy/cache')
const PROXY_ROOT_CRET_PATH = util.path.join(
  USERPROFILE,
  '.anyproxy/certificates/rootCA.crt'
)
const YYL_CONFIG_CACHE_PATH = util.path.join(USERPROFILE, '.yyl/config-log')

const Lang = {
  Help: {
    Desc: 'YYL 缓存相关信息',
    Clear: '清理缓存',
    Help: '显示帮助信息'
  },
  Question: {
    Clear: '选择需要清除的缓存'
  },
  ClearStart: '开始清理缓存',
  ClearFinished: '清理完成'
}

async function cache({ cmds, context, logger, env, shortEnv }) {
  switch (cmds[0]) {
    case 'clear':
      return cache.clear({ cmds, context, logger, env, shortEnv })

    default:
      return cache.help({ env })
  }
}

cache.clear = async function ({ logger }) {
  const cacheList = cache.list()
  const sortFn = function (item) {
    if (item.exists) {
      return 1
    } else {
      return 0
    }
  }
  const obj = await inquirer.prompt({
    type: 'list',
    name: 'result',
    message: `${Lang.Question.Clear}:`,
    choices: cacheList
      .sort((a, b) => sortFn(b) - sortFn(a))
      .map((item) => item.print),
    default: cacheList
      .filter((item) => item.exists)
      .map((item) => item.print)[0]
  })
  const resultCache = cacheList.filter((item) => item.print === obj.result)[0]
  logger.setProgress('start', 'info', [
    `${Lang.ClearStart}: ${chalk.green(resultCache.path)}`
  ])
  const delFiles = await extFs.removeFiles(resultCache.path)
  delFiles.forEach((ctx) => {
    logger.log('del', [ctx])
  })
  logger.setProgress('finished', 'success', [
    `${Lang.ClearFinished}: ${chalk.green(resultCache.path)}`
  ])
}

cache.list = function () {
  return [
    {
      key: 'cert',
      print: 'anyproxy cert',
      path: PROXY_ROOT_CRET_PATH,
      exists: fs.existsSync(PROXY_ROOT_CRET_PATH)
    },
    {
      key: 'anyproxy',
      print: 'anyproxy cache',
      path: PROXY_CACHE_PATH,
      exists: fs.existsSync(PROXY_CACHE_PATH)
    },
    {
      key: 'yyl',
      print: 'yyl config cache',
      path: YYL_CONFIG_CACHE_PATH,
      exists: fs.existsSync(YYL_CONFIG_CACHE_PATH)
    }
  ].map((item) => {
    if (item.exists) {
      item.print = chalk.yellow(item.print)
    } else {
      item.print = chalk.gray(item.print)
    }
    return item
  })
}

cache.help = function ({ env }) {
  const h = {
    usage: 'yyl cache',
    desc: Lang.Help.Desc,
    commands: {
      clear: Lang.Help.Clear
    },
    options: {
      '--help': Lang.Help.Help
    }
  }
  if (!env.silent) {
    printHelp(h)
  }
  return Promise.resolve(h)
}

module.exports = cache
