'use strict'
// const path = require('path');
// const fs = require('fs');
const print = require('yyl-print')
const vars = require('../lib/const.js')
const inquirer = require('inquirer')
const chalk = require('chalk')

const initMe = require('init-me')
const { seedFull2Short, seedShort2Full } = require('init-me/lib/formatter')
const { inYY } = require('init-me/lib/search')
const pkg = require('../package.json')

const LANG = require('../lang/index')
const seed = require('../lib/seed')

function printInfo({ env, str }) {
  if (!env.silent) {
    // eslint-disable-next-line no-console
    console.log(`${chalk.yellow('!')} ${str}`)
  }
}

function printSuccess({ env, str }) {
  if (!env.silent) {
    // eslint-disable-next-line no-console
    console.log(`${chalk.green('Y')} ${str}`)
  }
}

async function init({ env }) {
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

  printInfo({ env, str: LANG.INIT.INFO.LOADIND_SEED })
  // TODO: 缺个菊花
  const iSeed = await seed.get({
    name: rootSeed,
    env,
    logger: {
      log(type, args) {
        // TODO:
        console.log(type, args)
      }
    }
  })

  // TODO: init-me 缺个请求超时
  const IN_YY = await inYY()
  if (IN_YY) {
    printSuccess({ env, str: LANG.INIT.INFO.IN_YY })
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
    printInfo({
      env,
      str: `${LANG.INIT.INFO.LOADING_INIT_ME}: ${chalk.yellow(
        seedShort2Full(subSeed)
      )}`
    })

    // + 执行 init-me
    await initMe.init(vars.PROJECT_PATH, {
      env: Object.assign(env, {
        seed: seedShort2Full(subSeed),
        yylVersion: pkg.version
      }),
      inset: true
    })
    // - 执行 init-me
  } else {
    printInfo({ env, str: LANG.INIT.INFO.NOT_INIT_PACKAGE })
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
