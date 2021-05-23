const { SERVER_SEED_PATH } = require('../lib/const')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const util = require('yyl-util')
const { printHelp } = require('yyl-cmd-logger')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { printHeader } = require('../lib/util')

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
  SeedClearStart: '正在清空 seed 包',
  SeedClearFinished: '清空 seed 包完成',
  SeedClearNotNeed: '未安装任何 seed 包，无需清理',
  IgnoreCheckUpdate: '跳过 seed 包检查更新操作'
}

async function seed({ logger, env, cmds, shortEnv }) {
  if (cmds.length) {
    switch (cmds[0]) {
      // 初始化 seed
      case 'init':
        printHeader({ logger, env, cmds, shortEnv })
        return await seed.init({ logger, env })
      // seed 安装
      case 'i':
      case 'install':
        printHeader({ logger, env, cmds, shortEnv })
        return await seed.install({ logger, env, cmds: cmds.slice(1) })
      // 清除 seed
      case 'clear':
        printHeader({ logger, env, cmds, shortEnv })
        return await seed.clear({ logger, env })
      // 显示 help
      default:
        return await seed.help({ env, logger })
    }
  } else if (shortEnv.p || env.path) {
    return await seed.path({ env, logger })
  } else {
    return await seed.help({ env, logger })
  }
}

// seed 版本信息
seed.packages = [
  {
    name: 'yyl-seed-webpack',
    version: '3.0.10'
  },
  {
    name: 'yyl-seed-gulp-requirejs',
    version: '5.0.7'
  },
  {
    name: 'yyl-seed-other',
    version: '1.0.3'
  }
]

// 显示帮助信息
seed.help = function ({ env }) {
  const h = {
    usage: 'yyl seed',
    commands: {
      'init': Lang.HelpInit,
      'install <Packages>': Lang.HelpInstall,
      'clear': Lang.HelpClear
    },
    options: {
      '--force': Lang.HelpForce
    },
    others: {
      Packages: {
        'yyl-seed-gulp-requirejs': 'requirejs 类项目，支持 ie6+',
        'yyl-seed-webpack': 'webpack 类项目, 支持 ie9+',
        'yyl-seed-other': '其他类型项目，可嵌入 fec, feb 等构建工具'
      }
    }
  }
  if (!env.silent) {
    printHelp(h)
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
            `${chalk.cyan(`${item.name}@${seedPkg.version}`)}(${chalk.gray(
              item.version
            )})`
          )
        } else {
          // 小于设定版本
          needInstalls.push(`${item.name}@${item.version}`)
          seedInfos.push(
            `${chalk.red(`${item.name}@${seedPkg.version}`)}(${chalk.yellow(
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
        `${chalk.gray(`${item.name}@null`)}(${chalk.yellow(item.version)})`
      )
    }
  })

  logger.log('info', [`${Lang.SeedInfo}:`].concat(seedInfos))
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
    logger.log('info', [`${Lang.SeedInstallStart}: ${allowSeeds.join(' ')}`])
    logger.setProgress('start')
    let cmd = `yarn add ${allowSeeds.join(' ')} ${util.envStringify(env)}`
    if (!(await extOs.getYarnVersion())) {
      cmd = `npm i ${allowSeeds.join(' ')} ${util.envStringify(env)}`
    }
    logger.log('cmd', [cmd])
    await extOs.runSpawn(cmd, SERVER_SEED_PATH, (msg) => {
      logger.log('info', [msg.toString()])
    })
    logger.setProgress('finished', 'success', [Lang.SeedInstallFinished])
  } else {
    throw new Error(`${Lang.SeedNotAllow}: ${cmds} (${pkgNames.join('|')})`)
  }
}

seed.clear = async function ({ logger, env = {} }) {
  await seed.initServer({ logger })
  const nodeModulePath = path.join(SERVER_SEED_PATH, 'node_modules')
  const pkgNames = seed.packages
    .map((item) => item.name)
    .filter((name) => {
      return fs.existsSync(path.join(nodeModulePath, name))
    })

  if (!pkgNames.length) {
    logger.log('success', [Lang.SeedClearNotNeed])
    return
  }
  let cmd = `yarn remove ${pkgNames.join(' ')} ${util.envStringify(env)}`
  if (!(await extOs.getYarnVersion())) {
    cmd = `npm uninstall ${pkgNames.join(' ')} ${util.envStringify(env)}`
  }
  logger.log('cmd', [cmd])
  logger.setProgress('start', [Lang.SeedClearStart])
  await extOs.runSpawn(cmd, SERVER_SEED_PATH, (msg) => {
    logger.log('info', [msg.toString()])
  })
  logger.setProgress('finished', 'success', [Lang.SeedClearFinished])
}

seed.get = async function ({ name, logger, env }) {
  const seedPath = path.join(SERVER_SEED_PATH, 'node_modules', name)
  const pkgNames = seed.packages.map((item) => item.name)
  if (fs.existsSync(seedPath)) {
    // 检查是否需要更新
    const pkgPath = path.join(seedPath)
    const pkg = require(pkgPath)
    const seedInfo = seed.packages.filter((item) => item.name === name)[0]
    if (!env.doctor) {
      logger.log('info', [`${Lang.IgnoreCheckUpdate}`])
      logger.log('info', [
        `${Lang.SeedInfo}: ${chalk.yellow(`${name}@${pkg.version}`)}`
      ])
    } else if (util.compareVersion(pkg.version, seedInfo.version) < 0) {
      // 需要更新
      await seed.install({
        cmds: [`${seedInfo.name}@${seedInfo.version}`],
        logger,
        env: {}
      })
      if (require.cache[seedPath]) {
        delete require.cache[seedPath]
      }
    } else {
      logger.log('info', [
        `${Lang.SeedInfo}: ${chalk.yellow(`${name}@${pkg.version}`)}`
      ])
    }
    return require(seedPath)
  } else {
    if (pkgNames.includes(name)) {
      await seed.install({ cmds: [name], logger, env: {} })
      if (require.cache[seedPath]) {
        delete require.cache[seedPath]
      }
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
