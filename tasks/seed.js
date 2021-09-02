const { SERVER_SEED_PATH } = require('../lib/const')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const util = require('yyl-util')
const { printHelp } = require('yyl-cmd-logger')
const inquirer = require('inquirer')
const chalk = require('chalk')
const fs = require('fs')
const path = require('path')
const { printHeader } = require('../lib/util')

const Lang = {
  HelpInit: 'seed 初始化',
  HelpInstall: 'seed 包安装',
  HelpForce: '强制执行',
  HelpClear: '清除所有 seed',
  HelpList: '显示seed列表',
  QuestionSeedName: '可安装 seed',
  GetSeedVersionFail: '获取 seed 版本信息失败',
  SeedPath: 'seed 包所在目录',
  SeedInfo: 'seed 包信息',
  SeedNeedInstall: '需要更新 seed',
  SeedNeedNotInstall: '无需更新 seed',
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
        printHeader({ logger, env, cmds: ['seed'].concat(cmds), shortEnv })
        return await seed.init({ logger, env })

      // 显示seed列表
      case 'list':
        printHeader({ logger, env, cmds: ['seed'].concat(cmds), shortEnv })
        return await seed.list({ logger, env })
      // seed 安装
      case 'i':
      case 'install':
        printHeader({ logger, env, cmds: ['seed'].concat(cmds), shortEnv })
        return await seed.install({ logger, env, cmds: cmds.slice(1) })
      // 清除 seed
      case 'clear':
        printHeader({ logger, env, cmds: ['seed'].concat(cmds), shortEnv })
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
    version: '3.1.12'
  },
  {
    name: 'yyl-seed-gulp-requirejs',
    version: '5.0.11'
  },
  {
    name: 'yyl-seed-other',
    version: '1.0.5'
  }
]

// 显示帮助信息
seed.help = function ({ env }) {
  const h = {
    usage: 'yyl seed',
    commands: {
      'init': Lang.HelpInit,
      'list': Lang.HelpList,
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

seed.neetToUpdate = ({ name }) => {
  const seedPath = path.join(SERVER_SEED_PATH, 'node_modules')
  const sysSeedInfo = seed.packages.filter((item) => item.name === name)[0]
  if (!sysSeedInfo) {
    return true
  }
  const pkgPath = path.join(seedPath, name, 'package.json')
  if (!fs.existsSync(pkgPath)) {
    return true
  }
  try {
    const pkgVersion = require(pkgPath).version
    if (util.compareVersion(pkgVersion, sysSeedInfo.version) >= 0) {
      return false
    } else {
      return true
    }
  } catch (er) {
    return true
  }
}
seed.list = async function ({ logger }) {
  await seed.initServer({ logger })
  const seedPath = path.join(SERVER_SEED_PATH, 'node_modules')
  const seedInfos = []
  await util.forEach(seed.packages, async (item) => {
    const pkgPath = path.join(seedPath, item.name, 'package.json')
    let info
    if (fs.existsSync(pkgPath)) {
      try {
        const seedPkg = require(pkgPath)
        if (util.compareVersion(seedPkg.version, item.version) >= 0) {
          info = {
            print: `${chalk.cyan(
              `${item.name}@${seedPkg.version}`
            )}(${chalk.gray(item.version)})`,
            cmd: `${item.name}@${seedPkg.version}`,
            name: item.name,
            version: item.version,
            needUpdate: false
          }
        } else {
          // 小于设定版本
          info = {
            print: `${chalk.red(
              `${item.name}@${seedPkg.version}`
            )}(${chalk.yellow(item.version)})`,
            cmd: `${item.name}@${seedPkg.version}`,
            name: item.name,
            version: item.version,
            needUpdate: true
          }
        }
      } catch (er) {
        logger && logger.log('warn', [Lang.GetSeedVersionFail, item.seed, er])
      }
    } else {
      info = {
        print: `${chalk.gray(`${item.name}@null`)}(${chalk.yellow(
          item.version
        )})`,
        cmd: `${item.name}@${item.version}`,
        name: item.name,
        version: item.version,
        needUpdate: true
      }
    }
    if (info) {
      seedInfos.push(info)
    }
  })

  logger &&
    logger.log(
      'info',
      [`${Lang.SeedInfo}:`].concat(seedInfos.map((item) => item.print))
    )
  return seedInfos
}

seed.init = async function ({ logger, env }) {
  const needInstalls = (await seed.list({ logger }))
    .filter((item) => item.needUpdate)
    .map((item) => item.cmd)
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
    logger && logger.log('msg', ['info', [Lang.SeedConfigInitFinished]])
  }
}

// 安装 seed
seed.install = async function ({ logger, cmds, env }) {
  await seed.initServer({ logger })
  if (cmds.length === 0) {
    const seedInfos = await seed.list({})
    const obj = await inquirer.prompt({
      type: 'list',
      name: 'seed',
      message: `${Lang.QuestionSeedName}:`,
      choices: seedInfos.map((item) => item.print),
      default: seedInfos.filter((item) => item.needUpdate)[0]
        ? seedInfos.filter((item) => item.needUpdate)[0].print
        : seedInfos[0].print
    })
    const result = seedInfos.filter((item) => item.print === obj.seed)[0]
    cmds = [result.cmd]
  }
  const pkgNames = seed.packages.map((item) => item.name)
  const allowSeeds = cmds
    .filter((ctx) => {
      const arr = ctx.split('@')
      const name = arr[0]
      return pkgNames.includes(name)
    })
    .map((ctx) => {
      if (ctx.split('@').length == 1) {
        return `${ctx}@${
          seed.packages.filter((item) => item.name === ctx)[0].version
        }`
      } else {
        return ctx
      }
    })
  if (allowSeeds.length) {
    let needInstall = false
    allowSeeds.forEach((ctx) => {
      const arr = ctx.split('@')
      const name = arr[0]
      const version = arr[1]

      if (version) {
        needInstall = true
      } else {
        if (seed.neetToUpdate({ name })) {
          needInstall = true
        }
      }
    })
    if (!needInstall) {
      logger.log('success', [`${Lang.SeedNeedNotInstall}`])
      return
    }
    logger.log('info', [`${Lang.SeedInstallStart}: ${allowSeeds.join(' ')}`])
    logger.setProgress('start')
    let cmd = `yarn add ${allowSeeds.join(' ')} ${util.envStringify(
      env
    )} --verbose`
    if (!(await extOs.getYarnVersion())) {
      cmd = `npm i ${allowSeeds.join(' ')} ${util.envStringify(env)} --verbose`
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
