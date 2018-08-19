'use strict';
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');

const util = require('./w-util.js');
const wServer = require('./w-server');
const log = require('./w-log');
const SEED = require('./w-seed.js');

const SUGAR_REG = /(\{\$)(\w+)(\})/g;

const wOpzer = function(ctx, iEnv, configPath) {
  const runner = (next, reject) => {
    wOpzer.parseConfig(configPath, iEnv).then((config) => {
      // 版本检查
      const yylPkg = util.requireJs(path.join(__dirname, '../package.json'));

      if (util.compareVersion(config.version, yylPkg.version)) {
        return reject(`optimize fail, project required yyl at least ${config.version}`);
      }

      // workflow exists check
      const seed = SEED[config.workflow];
      if (!seed) {
        return reject(`optimize fail, config.workflow (${config.workflow}) is not in yyl seed, usage: ${Object.keys[SEED]}`);
      }
      const opzer = seed.optimize(config, path.dirname(configPath));

      // handle exists check
      if (!opzer[ctx] || util.type(opzer[ctx]) !== 'function') {
        return reject(`optimize fail handle [${ctx}] is not exists`);
      }

      const infobarName = ctx === 'watch'? 'watch' : 'optimize';

      opzer[ctx]()
        .on('start', () => {
          log('clear');
          log('start', infobarName);
        })
        .on('clear', () => {
          log('clear');
        })
        .on('msg', (type, argv) => {
          log('msg', type, argv);
        })
        .on('finished', () => {
          log('msg', 'success', [`task - ${ctx} finished ${chalk.yellow(util.getTime())}`]);
          log('finish', infobarName);
        });

      // 启动服务器
      if (ctx === 'watch') {

      }
      // TODO

    }).catch((er) => {
      reject(`yyl ${ctx} ${util.envStringify(iEnv)} error, ${er}`);
    });
  };

  return new Promise(runner);
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
  let r = [];
  if (!fs.existsSync(configPath)) {
    return r;
  }
  let config = null;
  try {
    config = require(configPath);
  } catch (er) {}

  if (config && config.workflow && SEED[config.workflow]) {
    const seed = SEED[config.workflow];
    r = seed.optimize.handles;
  }
  return r;
};

// 文本 sugar 替换
wOpzer.sugarReplace = (str, alias) => {
  return str.replace(SUGAR_REG, (str, $1, $2) => {
    if ($2 in alias) {
      return alias[$2];
    } else {
      return str;
    }
  });
};

// 解析 config 文件
wOpzer.parseConfig = (configPath, iEnv) => {
  const runner = (next, reject) => {
    let config = {};
    if (!fs.existsSync(configPath)) {
      return reject(`config path not exists: ${configPath}`);
    }

    try {
      Object.assign(config, require(configPath));
    } catch (er) {
      return reject(`config parse error: ${configPath}`, er);
    }

    // extend config.mine.js
    let mineConfig = {};
    const mineConfigPath = configPath.replace(/\.js$/, 'mine.js');

    if (fs.existsSync(mineConfigPath)) {
      try {
        mineConfig = require(mineConfigPath);
      } catch (er) {}
    }

    util.extend(true, config, mineConfig);

    // 单文件多配置情况处理
    if (iEnv.name && !config.workflow) {
      if (!config[iEnv.name]) {
        return reject(`--name ${iEnv.name} is not the right command, usage: ${Object.keys(config).join('|')}`);
      } else {
        config = config[iEnv.name];
      }
    }

    if (!config.workflow) {
      return reject('config.workflow is not defined');
    }

    // alias format to absolute
    Object.keys(config.alias).forEach((key) => {
      config.alias[key] = util.path.resolve(
        path.dirname(configPath),
        config.alias[key]
      );
    });


    // 文件变量解析
    const deep = (obj) => {
      Object.keys(obj).forEach((key) => {
        switch (util.type(obj[key])) {
          case 'array':
            obj[key] = obj[key].map((val) => {
              if (util.type(val) === 'string') {
                return wOpzer.sugarReplace(val, config.alias);
              } else {
                return val;
              }
            });

          case 'object':
            deep(obj[key]);
            break;

          case 'string':
            obj[key] = wOpzer.sugarReplace(obj[key], config.alias);
            break;

          case 'number':
            break;

          default:
            break;
        }
      });
    };
    ['resource', 'concat', 'commit'].forEach((key) => {
      if (util.type(config[key]) === 'object') {
        deep(config[key]);
      }
    });

    next(config);
  };

  return new Promise(runner);
};

module.exports = wOpzer;

