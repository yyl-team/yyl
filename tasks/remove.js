'use strict'
const path = require('path')
const fs = require('fs')

const util = require('yyl-util')
const extOs = require('yyl-os')
const extFs = require('yyl-fs')

const vars = require('../lib/vars.js')
const log = require('../lib/log.js')
const LANG = require('../lang/index')

const remove = async function (iPath) {
  log('start', 'remove')
  let tPath = ''
  if (path.isAbsolute(iPath)) {
    tPath = iPath
  } else {
    tPath = util.path.join(vars.PROJECT_PATH, iPath)
  }

  const iBaseName = path.basename(tPath)

  if (!fs.existsSync(tPath)) {
    log('msg', 'error', `${LANG.REMOVE.PATH_NOT_FOUND}: ${tPath}`)
    log('finish')
    throw new Error(`${LANG.REMOVE.PATH_NOT_FOUND}: ${tPath}`)
  }
  if (iBaseName == 'node_modules') {
    const dirList = fs.readdirSync(tPath)
    await util.forEach(dirList, async (pathname) => {
      const filePath = path.join(tPath, pathname)
      if (/ /.test(pathname)) {
        return log(
          'msg',
          'warn',
          `${LANG.REMOVE.FILE_NAME_WITH_SPACE_ERROR}: ${pathname}`
        )
      }

      if (!fs.statSync(filePath).isDirectory()) {
        return
      }

      if (/\.bin/.test(pathname)) {
        return
      }

      log('msg', 'info', `${LANG.REMOVE.PATH_CLEANING}: ${tPath}`)

      try {
        await extFs.removeFiles(tPath)
        log('msg', 'success', `${LANG.REMOVE.CLEAN_FINISHED}: ${tPath}`)
      } catch (er) {
        const iCmd = `npm uninstall ${pathname}`
        log('msg', 'info', `${LANG.REMOVE.RUN_CMD}: ${iCmd}`)
        await extOs.runCMD(iCmd)
      }
    })

    const files = await extFs.removeFiles(tPath, true)
    files.forEach((iPath) => {
      log('msg', 'del', iPath)
    })
    log('finished')
  } else {
    const files = await extFs.removeFiles(tPath, true)
    files.forEach((iPath) => {
      log('msg', 'del', iPath)
    })
    log('finished')
  }
}

module.exports = remove
