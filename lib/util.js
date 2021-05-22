const chalk = require('chalk')
const pkg = require('../package.json')
const util = require('yyl-util')

/** 打印 yyl 头信息 */
module.exports.printHeader = ({ logger, cmds, env, shortEnv }) => {
  logger.log('yyl', [`yyl ${chalk.yellow(pkg.version)}`])
  logger.log('cmd', [
    `yyl ${cmds.join(' ')} ${util.envStringify(env)} ${util.shortEnvStringify(
      shortEnv
    )}`
  ])
}
