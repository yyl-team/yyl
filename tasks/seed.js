const { SERVER_SEED_PATH } = require('../lib/const')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const util = require('yyl-util')
const print = require('yyl-print')
const fs = require('fs')
const path = require('path')

const Lang = {
  HelpList: '显示 seed 信息',
  HelpForce: '强制执行',
  SeedConfigInitFinished: 'seed 本地配置初始化完成',
  SeedNotAllow: 'seed 包不在可选范围',
  SeedInstallStart: 'seed 包开始安装',
  SeedInstallFinished: 'seed 包安装完成'
}

function seed({ logger, env, cmds }) {
  switch (cmds[0]) {
    // 初始化 seed
    case 'init':
      seed.init({ logger, env })
      break
    // seed 安装
    case 'i':
    case 'install':
      seed.install({ logger, env, cmds: cmds.slice(1) })
      break
    // seed 列表
    case 'list':
      seed.list({ logger, env })
      break
    // 显示 help
    default:
      seed.help({ env, logger })
      break
  }
}

seed.packages = [
  {
    name: 'yyl-seed-webpack',
    version: '3.0.1'
  },
  {
    name: 'yyl-seed-requirejs',
    version: '5.0.0'
  },
  {
    name: 'yyl-seed-other',
    version: '1.0.0'
  }
]

// 显示帮助信息
seed.help = function ({ env }) {
  const h = {
    usage: 'yyl seed <commands>',
    commands: {
      list: Lang.HelpList,
      init: Lang.HelpInit,
      install: Lang.Install
    }
  }
  if (!env.silent) {
    print.help(h)
  }
  return Promise.resolve(h)
}

// 初始化本地配置文件
seed.init = async function ({ logger }) {
  if (!fs.existsSync(SERVER_SEED_PATH)) {
    await extFs.mkdirSync(SERVER_SEED_PATH)
  }
  const pkgPath = path.join(SERVER_SEED_PATH, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    fs.writeFileSync(
      pkgPath,
      JSON.stringify(
        {
          name: 'yyl-seed-stages',
          version: '0.0.1',
          private: true
        },
        null,
        2
      )
    )
    logger.log('msg', ['info', [Lang.SeedConfigInitFinished]])
  }
}

seed.install = async function ({ logger, cmds, env }) {
  await seed.init({ logger })
  const allowSeeds = cmds.filter((ctx) => {
    const arr = ctx.split('@')
    const name = arr[0]
    return seed.packages.includes(name)
  })
  if (allowSeeds.length) {
    logger.log('msg', [
      'success',
      [`${Lang.SeedInstallStart}: ${allowSeeds.join(' ')}`]
    ])
    await extOs.runSpawn(
      `yarn add ${allowSeeds.join(' ')} ${util.envStringify(env)}`,
      SERVER_SEED_PATH,
      (msg) => {
        logger.log('msg', ['info', [msg.toString()]])
      }
    )
    logger.log('msg', ['success', [Lang.SeedInstallFinished]])
  } else {
    throw new Error(
      `${Lang.SeedNotAllow}: ${cmds} (${seed.packages.join('|')})`
    )
  }
}

seed.get = async function ({ name, logger, env = {} }) {
  const seedPath = path.join(SERVER_SEED_PATH, 'node_modules', name)
  if (fs.existsSync(seedPath)) {
    return require(seedPath)
  } else {
    if (seed.packages.includes(name)) {
      await seed.install({ cmds: [name], logger, env })
      return require(seedPath)
    } else {
      throw new Error(
        `${Lang.SeedNotAllow}: ${seed} (${seed.packages.join('|')})`
      )
    }
  }
}

module.exports = seed
