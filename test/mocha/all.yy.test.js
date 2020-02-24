const path = require('path')
const extFs = require('yyl-fs')
const extOs = require('yyl-os')
const fs = require('fs')
const projectGits = [
  'https://git.yy.com/webs/web_static/yycom.git',
  'https://git.yy.com/webs/web_static/yycom_header.git',
  'https://git.yy.com/webs/web_static/yycom_h5_live.git',
  'https://git.yy.com/webs/web_static/usercenter.git'
]

const FRAG_PATH = path.join(__dirname, '../__gitcase')

projectGits.forEach((gitPath) => {
  const pjName = path.basename(gitPath).replace('.git', '')
  const pjPath = path.join(FRAG_PATH, pjName)
  describe(`项目试运行 ${gitPath}`, () => {
    beforeEach(async () => {
      if (fs.existsSync(pjPath)) {
        await extOs.runSpawn('git pull', FRAG_PATH)
      } else {
        await extFs.mkdirSync(FRAG_PATH)
        await extOs.runSpawn(`git clone ${gitPath}`, FRAG_PATH)
      }
      await extOs.runSpawn('git checkout master', FRAG_PATH)
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
      // await yyl.run(`all ${prefix} --silent`, pjPath)
      // await yyl.run(`all ${prefix} --isCommit --silent`, pjPath)
    })
  })
})