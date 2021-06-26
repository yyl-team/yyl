'use strict'
const chalk = require('chalk')
const util = require('yyl-util')
const { getPkgLatestVersion } = require('../lib/util')
const wVersion = async function ({ env }) {
  const iVer = require('../package.json').version
  if (!env.silent) {
    console.log(
      [
        chalk.yellow('----    ----    --------'),
        chalk.yellow('----    ----          --'),
        chalk.yellow('----    ----    --------'),
        chalk.yellow('----    ----    --      '),
        chalk.yellow('----    ----    --------'),
        chalk.yellow('----    ----            '),
        chalk.yellow('----    ----            '),
        chalk.yellow('------------    --      '),
        chalk.yellow('  --------      --      '),
        chalk.yellow('    ----        --      '),
        chalk.yellow('    ----        --      '),
        chalk.yellow('    ----        --------'),
        '',
        `    ${`yyl version: ${iVer}`}`
      ].join('\n')
    )
    const latestVer = await getPkgLatestVersion('yyl')
    console.log(
      [
        `    ${`     ${chalk.gray('latest:')} ${
          util.compareVersion(latestVer, iVer) > 0
            ? chalk.yellow(latestVer)
            : chalk.gray(latestVer)
        }`}`
      ].join('\n')
    )
  }

  return Promise.resolve(iVer)
}

module.exports = wVersion
