'use strict'
const { printHelp } = require('yyl-cmd-logger')
const inquirer = require('inquirer')
const chalk = require('chalk')

const initMe = require('init-me')
const { seedFull2Short, seedShort2Full } = require('init-me/lib/formatter')
const { inYY } = require('init-me/lib/search')
const pkg = require('../package.json')
const seed = require('./seed')

const LANG = {
  INIT: {
    QUESTION: {
      ROOT_SEED: 'seed 包选择',
      SUB_SEED: '选择用于初始化的 init-me seed 包'
    },
    HELP: {
      HELP: '显示帮助信息',
      NAME: '项目名称设置',
      NO_INSTALL: '初始化结束后不执行 npm install 初始化'
    },
    INFO: {
      LOADIND_SEED: '正在加载 seed 包',
      IN_YY: '您正在处于 YY 网环境',
      LOADING_INIT_ME: '正在解析 seed 包',
      NOT_INIT_PACKAGE: '当前 seed 包没配置 初始化 seed'
    }
  }
}

async function init({ env, context, logger, shortEnv }) {
  if (env.help || shortEnv.h) {
    return init.help({ env })
  }
  // + rootSeed
  const { packages } = seed
  let rootSeed = env.rootSeed
  if (!rootSeed || packages.map((item) => item.name).indexOf(rootSeed) === -1) {
    rootSeed = (
      await inquirer.prompt([
        {
          type: 'list',
          name: 'rootSeed',
          message: `${LANG.INIT.QUESTION.ROOT_SEED}:`,
          choices: packages,
          default: packages[0]
        }
      ])
    ).rootSeed
  }
  // - rootSeed

  logger.setProgress('start', [])
  logger.log('info', [LANG.INIT.INFO.LOADIND_SEED])
  let iSeed
  try {
    iSeed = await seed.get({
      name: rootSeed,
      env,
      logger: {
        log(type, args) {
          logger.log(type, args)
        }
      }
    })
    logger.setProgress('finished', [])
  } catch (er) {
    logger.log('error', [er])
    logger.setProgress('finished', [])
  }

  const IN_YY = await inYY()
  if (IN_YY) {
    logger.log('success', [LANG.INIT.INFO.IN_YY])
  }

  // + subSeed
  let subSeeds = iSeed.initPackage[IN_YY ? 'yy' : 'default'].map((name) =>
    seedFull2Short(name)
  )
  let subSeed = env.subSeed
  if (!subSeed || subSeed.indexOf(subSeeds) === -1) {
    if (subSeeds.length > 1) {
      subSeed = (
        await inquirer.prompt([
          {
            type: 'list',
            name: 'subSeed',
            choices: subSeeds,
            default: subSeeds[0],
            message: `${LANG.INIT.QUESTION.SUB_SEED}`
          }
        ])
      ).subSeed
    } else {
      subSeed = subSeeds[0]
    }
  }
  // - subSeed
  if (subSeed) {
    logger.log('info', [
      `${LANG.INIT.INFO.LOADING_INIT_ME}: ${chalk.yellow(
        seedShort2Full(subSeed)
      )}`
    ])

    // + 执行 init-me
    return await initMe.init(context, {
      env: Object.assign(env, {
        seed: seedShort2Full(subSeed),
        yylVersion: pkg.version
      }),
      inset: true,
      logger: logger
    })
    // - 执行 init-me
  } else {
    logger.log('info', [LANG.INIT.INFO.NOT_INIT_PACKAGE])
  }
}

init.help = ({ env }) => {
  const h = {
    usage: 'yyl init',
    options: {
      '--help': LANG.INIT.HELP.HELP,
      '--noinstall': LANG.INIT.HELP.NO_INSTALL
    }
  }
  if (!env.silent) {
    printHelp(h)
  }
  return Promise.resolve(h)
}

module.exports = init
