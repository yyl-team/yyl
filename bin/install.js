const chalk = require('chalk')
const command = require('./cmd.js')
const { YylCmdLogger } = require('yyl-cmd-logger')

const logger = new YylCmdLogger({
  lite: true,
  type: {
    yyl: {
      name: 'YYL>',
      color: chalk.white.bgBlack.bold,
      shortName: '>',
      shortColor: chalk.cyan
    }
  }
})

command({
  cmds: 'seed install yyl-seed-webpack'.split(' '),
  context: __dirname,
  env: {},
  shortEnv: {},
  logger
})
