const { SERVER_SEED_PATH } = require('./const')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const util = require('yyl-util')
const fs = require('fs')
const path = require('path')

const Lang = {
  SeedConfigInitFinished: 'seed 本地配置初始化完成',
  SeedNotAllow: 'seed 包不在可选范围',
  SeedInstallStart: 'seed 包开始安装',
  SeedInstallFinished: 'seed 包安装完成'
}

const seed = {
  packages: ['yyl-seed-webpack', 'yyl-seed-requirejs', 'yyl-seed-other'],
  // 初始化本地配置文件
  async init({ logger }) {
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
  },

  async install({ logger, cmds, env }) {
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
  },
  async get({ name, logger, env = {} }) {
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
}

module.exports = seed
