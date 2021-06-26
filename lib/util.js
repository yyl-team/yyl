const chalk = require('chalk')
const pkg = require('../package.json')
const extOs = require('yyl-os')
const util = require('yyl-util')

/** 打印 yyl 头信息 */
module.exports.printHeader = ({ logger, cmds, env, shortEnv }) => {
  logger.log('yyl', [`${chalk.green('yyl')} ${chalk.yellow(pkg.version)}`])
  logger.log('cmd', [
    `yyl ${cmds.join(' ')} ${util.envStringify(env)} ${util.shortEnvStringify(
      shortEnv
    )}`
  ])
}

/** 获取安装包最新版本 */
module.exports.getPkgLatestVersion = async (pkgName) => {
  let r = ''
  r = await extOs.runCMD(`npm view ${pkgName} version`, __dirname, false)
  return r.replace(/[\r\n]/g, '')
}
