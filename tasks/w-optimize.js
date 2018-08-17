'use strict';
const fs = require('fs');
const chalk = require('chalk');

const util = require('./w-util.js');
const wServer = require('./w-server');
const log = require('./w-log');
const SEED = require('./w-seed.js');

const wOpzer = function(ctx, iEnv) {
  // const runner = (done, reject) => {
  //   new util.Promise((next) => {
  //     log('clear');
  //     log('cmd', `yyl ${iArgv.join(' ')}`);
  //     log('start', 'server', 'init config...');
  //     log('msg', 'info', 'build server config start');
  //     wServer.buildConfig(iEnv.name, iEnv).then((config) => {
  //       log('msg', 'success', 'init config finished');
  //       next(config);
  //     }).catch((err) => {
  //       log('msg', 'error', ['init server config error:', err.message]);
  //       log('finish');
  //       reject(err);
  //     });
  //   }).then((config, next) => { // 检测 版本
  //     const yylPkg = util.requireJs(util.path.join(__dirname, '../package.json'));
  //     if (util.compareVersion(config.version, yylPkg.version) > 0) {
  //       log('msg', 'error', `optimize fail, project require yyl at least ${config.version}`);
  //       log('msg', 'warn', 'please update your yyl: npm install yyl -g');
  //       log('finish');
  //       reject(`optimize fail, project require yyl at least ${config.version}`);
  //     } else {
  //       next(config);
  //     }
  //   }).then((config, next) => { // 清除 localserver 目录下原有文件
  //     if (fs.existsSync(config.localserver.root)) {
  //       log('msg', 'info', `clean Path start: ${config.localserver.root}`);
  //       util.removeFiles(config.localserver.root, () => {
  //         log('msg', 'success', `clean path finished: ${chalk.yellow(config.localserver.root)}`);
  //         next(config);
  //       });
  //     } else {
  //       next(config);
  //     }
  //   }).then((config, next) => { // server init
  //     if (/watch/.test(iArgv[0])) {
  //       if (config.localserver.port) {
  //         util.checkPortUseage(config.localserver.port, (canUse) => {
  //           if (canUse) {
  //             log('end');
  //             let cmd = 'yyl server start --silent';
  //             if (iEnv.name) {
  //               cmd = `${cmd} --name ${iEnv.name}`;
  //             }
  //             util.runCMD(cmd, () => {
  //               next(config);
  //             }, util.vars.PROJECT_PATH, true, true);
  //           } else {
  //             log('msg', 'warn', `port ${chalk.yellow(config.localserver.port)} is occupied, yyl server start failed`);
  //             next(config);
  //           }
  //         });
  //       } else {
  //         log('msg', 'info', 'config.localserver.port is not setted, next');
  //         next(config);
  //       }
  //     } else {
  //       next(config);
  //     }
  //   }).then((config, next) => { // check node_modules was installed
  //     wServer.updateNodeModules(config.workflow).then((err) => {
  //       if (err) {
  //         log('msg', 'error', err);
  //         log('finish');
  //       } else {
  //         next(config);
  //       }
  //     });
  //   }).then((config) => { // 运行命令
  //     const initPath = util.path.join(util.vars.INIT_FILE_PATH, config.workflow, 'index.js');
  //     log('finish');
  //     let opzer;
  //     try {
  //       opzer = util.requireJs(initPath);
  //     } catch (er) {
  //       return reject(er);
  //     }
  //     opzer(config, iArgv[0], iEnv).then(() => {
  //       done(config);
  //     }).catch((er) => {
  //       return Promise.reject(er);
  //     });
  //   }).start();
  // };

  return Promise.resolve(null);
  // return new Promise((next, reject) => {
  //   runner(next, reject);
  // });
};

// 获取 可操作的 句柄
wOpzer.getHandles = (configPath) => {
  console.log('00000000000',configPath)
  let r = [];
  if (!fs.existsSync(configPath)) {
    console.log(111111)
    return r;
  }
  let config = null;
  try {
    config = require(configPath);
  } catch (er) {
    console.log('???', er)
  }

  console.log('===', config.workflow)
  if (config && config.workflow && SEED[config.workflow]) {
    console.log(22222)
    const seed = SEED[config.workflow];
    r = seed.optimize.handles;
  }
  console.log(3333333333)
  return r;
};

module.exports = wOpzer;

