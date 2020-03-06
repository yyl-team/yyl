const path = require('path')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const fs = require('fs')
const FRAG_PATH = path.join(__dirname, '../__gitcase')

module.exports.handleAllGit = function (gitPath) {
  const pjName = path.basename(gitPath).replace('.git', '')
  const pjPath = path.join(FRAG_PATH, pjName)
  describe(`项目试运行 ${gitPath}`, () => {
    beforeEach(async () => {
      if (fs.existsSync(pjPath)) {
        if (fs.existsSync(path.join(pjPath, '.git'))) {
          await extOs.runSpawn('git reset --hard', pjPath)
          await extOs.runSpawn('git pull', pjPath)
        } else {
          await extFs.removeFiles(pjPath, true)
          await extOs.runSpawn(`git clone ${gitPath}`, FRAG_PATH)
        }
      } else {
        await extFs.mkdirSync(FRAG_PATH)
        await extOs.runSpawn(`git clone ${gitPath}`, FRAG_PATH)
      }
      await extOs.runSpawn('git checkout master', pjPath)
    })

    it (`${pjName} - yyl all`, async () => {
      let pjConfigPath = ''
      const configPath = path.join(pjPath, 'yyl.config.js')
      const legacyConfigPath = path.join(pjPath, 'config.js')
      if (fs.existsSync(configPath)) {
        pjConfigPath = configPath
      } else if (fs.existsSync(legacyConfigPath)) {
        pjConfigPath = legacyConfigPath
      } else {
        throw new Error(`配置不存在: ${configPath}|${legacyConfigPath}`)
      }
      const localConfig = require(pjConfigPath)
      let prefix = ''
      if (localConfig.pc) {
        prefix = '--name pc'
      }
      await extOs.runSpawn(`yyl all ${prefix}`, pjPath)
      await extOs.runSpawn(`yyl all ${prefix} --isCommit`, pjPath)
    })
  })
}