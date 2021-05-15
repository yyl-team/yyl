'use strict'
const print = require('yyl-print')
const inquirer = require('inquirer')
const YylCmdLogger = require('yyl-cmd-logger')
const chalk = require('chalk')

const initMe = require('init-me')
const { seedFull2Short, seedShort2Full } = require('init-me/lib/formatter')
const { inYY } = require('init-me/lib/search')
const pkg = require('../package.json')

const LANG = require('../lang/index')
const seed = require('../lib/seed')

const liteLogger = new YylCmdLogger({
  lite: true,
  progressInfo: {
    shortColor: chalk.cyan,
    shortIcons: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
  }
})

async function init({ env, context }) {
  if (env.logLevel !== undefined) {
    liteLogger.setLogLevel(env.logLevel)
  }
  // + rootSeed
  const { packages } = seed
  let rootSeed = env.rootSeed
  if (!rootSeed || packages.indexOf(rootSeed) === -1) {
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

  liteLogger.setProgress('start', [])
  liteLogger.log('info', [LANG.INIT.INFO.LOADIND_SEED])
  let iSeed
  try {
    iSeed = await seed.get({
      name: rootSeed,
      env,
      logger: {
        log(type, args) {
          liteLogger.log(type, args)
        }
      }
    })
    liteLogger.setProgress('finished', [])
  } catch (er) {
    liteLogger.log('error', [er])
    liteLogger.setProgress('finished', [])
  }

  const IN_YY = await inYY()
  if (IN_YY) {
    liteLogger.log('success', [LANG.INIT.INFO.IN_YY])
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
    liteLogger.log('info', [
      `${LANG.INIT.INFO.LOADING_INIT_ME}: ${chalk.yellow(
        seedShort2Full(subSeed)
      )}`
    ])

    // + 执行 init-me
    await initMe.init(context, {
      env: Object.assign(env, {
        seed: seedShort2Full(subSeed),
        yylVersion: pkg.version
      }),
      inset: true,
      logger: liteLogger
    })
    // - 执行 init-me
  } else {
    liteLogger.log('info', [LANG.INIT.INFO.NOT_INIT_PACKAGE])
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
    print.help(h)
  }
  return Promise.resolve(h)
}

module.exports = init
