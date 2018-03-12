'use strict';
var fs = require('fs');
var chalk = require('chalk');

var util = require('./w-util.js');
var wServer = require('./w-server');
var log = require('./w-log');

var
  wOptimize = function() {
    var iArgv = util.makeArray(arguments);
    var iEnv = util.envPrase(iArgv);

    const runner = (done) => {
      new util.Promise((next) => {
        log('clear');
        log('start', 'server', 'server init...');
        log('msg', 'info', 'build server config start');
        wServer.buildConfig(iEnv.name, iEnv).then((config) => {
          log('msg', 'success', 'build server config finished');
          next(config);
        }).catch((err) => {
          log('msg', 'error', ['build server config error:', err]);
          log('finish');
          throw new Error(err);
        });
      }).then((config, next) => { // 检测 版本
        const yylPkg = util.requireJs(util.path.join(__dirname, '../package.json'));
        if (util.compareVersion(config.version, yylPkg.version) > 0) {
          log('msg', 'error', `optimize fail, project require yyl at least ${config.version}`);
          log('msg', 'warn', 'please update your yyl: npm install yyl -g');
          log('finish');
          throw new Error(`optimize fail, project require yyl at least ${config.version}`);
        } else {
          next(config);
        }
      }).then((config, next) => { // 清除 localserver 目录下原有文件
        if (fs.existsSync(config.localserver.root)) {
          log('msg', 'info', `clean Path start: ${config.localserver.root}`);
          util.removeFiles(config.localserver.root, () => {
            log('msg', 'success', `clean path finished: ${chalk.yellow(config.localserver.root)}`);
            next(config);
          });
        } else {
          next(config);
        }
      }).then((config, next) => { // server init
        if (/watch/.test(iArgv[0])) {
          if (config.localserver.port) {
            util.checkPortUseage(config.localserver.port, (canUse) => {
              if (canUse) {
                log('end');
                util.runCMD('yyl server start --silent', () => {
                  next(config);
                }, util.vars.PROJECT_PATH, true, true);
              } else {
                log('msg', 'warn', `port ${chalk.yellow(config.localserver.port)} is occupied, yyl server start failed`);
                next(config);
              }
            });
          } else {
            log('msg', 'info', 'config.localserver.port is not setted, next');
            next(config);
          }
        } else {
          next(config);
        }
      }).then((config, next) => { // check node_modules was installed
        wServer.updateNodeModules(config.workflow).then((err) => {
          if (err) {
            log('msg', 'error', err);
            log('finish');
          } else {
            next(config);
          }
        });
      }).then((config) => { // 运行命令
        const initPath = util.path.join(util.vars.INIT_FILE_PATH, config.workflow, 'index.js');
        log('finish');
        const opzer = require(initPath);
        opzer(config, iArgv[0], iEnv).then(() => {
          done(config);
        });
      }).start();
    };

    return new Promise((next) => {
      runner(next);
    });
  };


module.exports = wOptimize;

