const { SERVER_SEED_PATH } = require('../lib/const')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const util = require('yyl-util')
const print = require('yyl-print')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')

const Lang = {
  HelpInit: 'seed 初始化',
  HelpInstall: 'seed 包安装',
  HelpForce: '强制执行',
  HelpClear: '清除所有 seed',
  GetSeedVersionFail: '获取 seed 版本信息失败',
  SeedPath: 'seed 包所在目录',
  SeedInfo: 'seed 包信息',
  SeedNeedInstall: 'seed 需要更新',
  SeedNeedNotInstall: 'seed 无需更新',
  SeedConfigInitFinished: 'seed 本地配置初始化完成',
  SeedNotAllow: 'seed 包不在可选范围',
  SeedInstallStart: 'seed 包开始安装',
  SeedInstallFinished: 'seed 包安装完成',
  SeedClearFinished: 'seed 清除完成'
}

function seed({ logger, env, cmds, shortEnv }) {
  if (cmds.length) {
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
      // 清除 seed
      case 'clear':
        seed.clear({ logger, env })
        break
      // 显示 help
      default:
        seed.help({ env, logger })
        break
    }
  } else if (shortEnv.p || env.path) {
    seed.path({ env, logger })
  }
}

// seed 版本信息
seed.packages = [
  {
    name: 'yyl-seed-webpack',
    version: '3.0.3'
  },
  {
    name: 'yyl-seed-gulp-requirejs',
    version: '5.0.1'
  },
  {
    name: 'yyl-seed-other',
    version: '1.0.2'
  }
]

// 显示帮助信息
seed.help = function ({ env }) {
  const h = {
    usage: 'yyl seed',
    commands: {
      'init': Lang.HelpInit,
      'install <packages>': Lang.HelpInstall,
      'clear': Lang.HelpClear
    },
    options: {
      '<packages>': seed.packages.map((item) => item.name).join('|'),
      '--force': Lang.HelpForce
    }
  }
  if (!env.silent) {
    print.help(h)
  }
  return Promise.resolve(h)
}

seed.init = async function ({ logger, env }) {
  await seed.initServer({ logger })
  const seedPath = path.join(SERVER_SEED_PATH, 'node_modules')
  const needInstalls = []
  const seedInfos = []
  await util.forEach(seed.packages, async (item) => {
    const pkgPath = path.join(seedPath, item.name, 'package.json')
    if (fs.existsSync(pkgPath)) {
      try {
        const seedPkg = require(pkgPath)
        if (util.compareVersion(seedPkg.version, item.version) >= 0) {
          // 大于设定版本
          seedInfos.push(
            `${item.name}@${chalk.cyan(seedPkg.version)}(${chalk.gray(
              item.version
            )})`
          )
        } else {
          // 小于设定版本
          needInstalls.push(`${item.name}@${item.version}`)
          seedInfos.push(
            `${item.name}@${chalk.cyan(seedPkg.version)}(${chalk.red(
              item.version
            )})`
          )
        }
      } catch (er) {
        logger.log('warn', [Lang.GetSeedVersionFail, item.seed, er])
      }
    } else {
      needInstalls.push(`${item.name}@${item.version}`)
      seedInfos.push(
        `${item.name}@${chalk.gray('null')}(${chalk.red(item.version)})`
      )
    }
  })

  logger.log('info', [`${Lang.SeedInfo}:`])
  seedInfos.forEach((ctx) => {
    logger.log('info', [ctx])
  })
  if (needInstalls.length) {
    await seed.install({
      cmds: needInstalls,
      env,
      logger
    })
  } else {
    logger.log('success', [Lang.SeedNeedNotInstall])
  }
}

// 初始化本地配置文件
seed.initServer = async function ({ logger }) {
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

// 安装 seed
seed.install = async function ({ logger, cmds, env }) {
  await seed.initServer({ logger })
  const pkgNames = seed.packages.map((item) => item.name)
  const allowSeeds = cmds.filter((ctx) => {
    const arr = ctx.split('@')
    const name = arr[0]
    return pkgNames.includes(name)
  })
  if (allowSeeds.length) {
    logger.log('success', [`${Lang.SeedInstallStart}: ${allowSeeds.join(' ')}`])
    let cmd = `yarn add ${allowSeeds.join(' ')} ${util.envStringify(env)}`
    if (!(await extOs.getYarnVersion())) {
      cmd = `npm i ${allowSeeds.join(' ')} ${util.envStringify(env)}`
    }
    logger.log('cmd', [cmd])
    await extOs.runSpawn(cmd, SERVER_SEED_PATH, (msg) => {
      logger.log('info', [msg.toString()])
    })
    logger.log('success', [Lang.SeedInstallFinished])
  } else {
    throw new Error(`${Lang.SeedNotAllow}: ${cmds} (${pkgNames.join('|')})`)
  }
}

seed.clear = async function ({ logger, env = {} }) {
  await seed.initServer({ logger })
  const pkgNames = seed.packages.map((item) => item.name)
  let cmd = `yarn remove ${pkgNames.join(' ')} ${util.envStringify(env)}`
  if (!(await extOs.getYarnVersion())) {
    cmd = `npm uninstall ${pkgNames.join(' ')} ${util.envStringify(env)}`
  }
  logger.log('cmd', [cmd])
  await extOs.runSpawn(cmd, SERVER_SEED_PATH, (msg) => {
    logger.log('info', [msg.toString()])
  })
  logger.log('success', [Lang.SeedClearFinished])
}

seed.get = async function ({ name, logger }) {
  const seedPath = path.join(SERVER_SEED_PATH, 'node_modules', name)
  const pkgNames = seed.packages.map((item) => item.name)
  if (fs.existsSync(seedPath)) {
    // 检查是否需要更新
    const pkgPath = path.join(seedPath)
    const pkg = require(pkgPath)
    const seedInfo = seed.packages.filter((item) => item.name === name)[0]
    if (util.compareVersion(pkg.version, seedInfo.version) < 0) {
      // 需要更新
      await seed.install({
        cmds: [`${seedInfo.name}@${seedInfo.version}`],
        logger,
        env: {}
      })
    } else {
      logger.log('info', [
        `${Lang.SeedInfo}: ${chalk.yellow(`${name}@${pkg.version}`)}`
      ])
    }
    return require(seedPath)
  } else {
    if (pkgNames.includes(name)) {
      await seed.install({ cmds: [name], logger, env: {} })
      return require(seedPath)
    } else {
      throw new Error(`${Lang.SeedNotAllow}: ${seed} (${pkgNames.join('|')})`)
    }
  }
}

seed.path = async function ({ env, logger }) {
  await seed.initServer({ env, logger })
  if (!env.silent) {
    logger.log('info', [`${Lang.SeedPath}: ${chalk.yellow(SERVER_SEED_PATH)}`])
    extOs.openPath(SERVER_SEED_PATH)
  }
  return SERVER_SEED_PATH
}

module.exports = seed
