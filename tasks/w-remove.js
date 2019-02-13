'use strict';
const path = require('path');
const fs = require('fs');

const util = require('yyl-util');
const extOs = require('yyl-os');
const extFs = require('yyl-fs');

const vars = require('../lib/vars.js');
const log = require('../lib/log.js');

const remove = async function(iPath) {
  log('start', 'remove');
  let tPath = '';
  if (path.isAbsolute(iPath)) {
    tPath = iPath;
  } else {
    tPath = util.path.join(vars.PROJECT_PATH, iPath);
  }

  const iBaseName = path.basename(tPath);

  if (!fs.existsSync(tPath)) {
    log('msg', 'error', `${tPath} is not exists`);
    log('finish');
    throw `${tPath} is not exists`;
  }
  if (iBaseName == 'node_modules') {
    const dirList = fs.readdirSync(tPath);
    await util.forEach(dirList, async (pathname) => {
      const filePath = path.join(tPath, pathname);
      if (/ /.test(pathname)) {
        return log('msg', 'warn', `filename with space, cannot remove: ${pathname}`);
      }

      if (!fs.statSync(filePath).isDirectory()) {
        return;
      }

      if (/\.bin/.test(pathname)) {
        return;
      }

      log('msg', 'info', `clearing path: ${tPath}`);

      try {
        await extFs.removeFiles(tPath);
        log('msg', 'success', `clear finished: ${tPath}`);
      } catch (er) {
        const iCmd = `npm uninstall ${pathname}`;
        log('msg', 'info', `run cmd ${iCmd}`);
        await extOs.runCMD(iCmd);
      }
    });

    const files = await extFs.removeFiles(tPath, true);
    files.forEach((iPath) => {
      log('msg', 'del', iPath);
    });
    log('finished');
  } else {
    const files = await extFs.removeFiles(tPath, true);
    files.forEach((iPath) => {
      log('msg', 'del', iPath);
    });
    log('finished');
  }
};


module.exports = remove;
