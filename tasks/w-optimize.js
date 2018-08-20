'use strict';
const fs = require('fs');
const chalk = require('chalk');
const path = require('path');
const extFs = require('yyl-fs');

const util = require('./w-util.js');
const log = require('./w-log');
const SEED = require('./w-seed.js');

const SUGAR_REG = /(\{\$)(\w+)(\})/g;

const fn = {
  exit(errMsg, reject) {
    log('msg', 'error', errMsg);
    log('finish');
    reject(errMsg);
  }
};

const wOpzer = function(ctx, iEnv, configPath) {
  const infobarName = ctx === 'watch'? 'watch' : 'optimize';
  const runner = (done, reject) => {
    log('clear');
    log('start', infobarName);
    new util.Promise((next) => { // parseConfig
      log('msg', 'info', 'parse config start');
      wOpzer.parseConfig(configPath, iEnv).then((config) => {
        log('msg', 'success', 'parse config finished');
        next(config);
      }).catch((er) => {
        fn.exit(`yyl ${ctx} ${util.envStringify(iEnv)} error, ${er}`, reject);
      });
    }).then((config, next) => { // prefix check
      // 版本检查
      const yylPkg = util.requireJs(path.join(__dirname, '../package.json'));

      if (util.compareVersion(config.version, yylPkg.version) > 0) {
        return fn.exit(`optimize fail, project required yyl at least ${config.version}`, reject);
      }

      // workflow exists check
      const seed = SEED[config.workflow];
      if (!seed) {
        return fn.exit(`optimize fail, config.workflow (${config.workflow}) is not in yyl seed, usage: ${Object.keys[SEED]}`, reject);
      }
      const opzer = seed.optimize(config, path.dirname(configPath));

      // handle exists check
      if (!opzer[ctx] || util.type(opzer[ctx]) !== 'function') {
        return fn.exit(`optimize fail handle [${ctx}] is not exists`, reject);
      }
      next(config, opzer);
    }).then((config, opzer, next) => { // package check
      wOpzer.initPlugins(config).then(() => {
        next(config, opzer);
      }).catch((er) => {
        return fn.exit(`optimize fail, plugins install error: ${er.message}`, reject);
      });
    }).then((config, opzer, next) => { // clean dist
      extFs.removeFiles(config.localserver.root).then(() => {
        next(config, opzer);
      });
    }).then((config, opzer, next) => { // localserver start
      if (ctx === 'watch' && iEnv.proxy) {
        if (config.localserver.port) {
          util.checkPortUseage(config.localserver.port, (canUse) => {
            if (canUse) {
              let cmd = 'yyl server start --silent';
              if (iEnv.name) {
                cmd = `${cmd} --name ${iEnv.name}`;
              }
              util.runCMD(cmd, () => {
                next(config, opzer);
              }, util.vars.PROJECT_PATH, true, true);
            } else {
              log('msg', 'warn', `port ${chalk.yellow(config.localserver.port)} is occupied, yyl server start failed`);
              next(config, opzer);
            }
          });
        } else {
          next(config, opzer);
        }
      } else {
        next(config, opzer);
      }
    }).then((config, opzer, next) => { // optimize
      let frag = 0;
      opzer[ctx]()
        .on('start', () => {
          if (frag) {
            log('clear');
          }
        })
        .on('clear', () => {
          log('clear');
        })
        .on('msg', (type, argv) => {
          log('msg', type, argv);
        })
        .on('finished', () => {
          frag = 1;
          log('msg', 'success', [`task - ${ctx} finished ${chalk.yellow(util.getTime())}`]);
          log('finish', infobarName);
          if (
            infobarName === 'watch' &&
            !frag &&
            !iEnv.silent &&
            iEnv.proxy
          ) {

          }
        });
      next(config, opzer);
    }).then(() => {

    }).start();
  };

  return new Promise(runner);
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

    // 必要字段检查
    if (!config.alias) {
      config.alias = {};
      log('msg', 'warn', `${chalk.yellow('config.alias')} is not exist, build it config.alias = {}`);
    }
    if (!config.alias.dirname) {
      config.alias.dirname = util.vars.PROJECT_PATH;
      log('msg', 'warn', `${chalk.yellow('config.alias.dirname')} is not exist, build it ${chalk.cyan(`config.alias.dirname = ${util.vars.PROJECT_PATH}`)}`);
    }

    if (!config.platform) {
      config.platform = 'pc';
      log('msg', 'warn', `${chalk.yellow('config.platform')} is not exist, build it ${chalk.cyan(`config.platform = ${config.platform}`)}`);
    }

    // localserver
    if (!config.localserver) {
      config.localserver = {};
    }

    if (!config.localserver.root) {
      config.localserver.root = util.path.join(util.vars.PROJECT_PATH, 'dist');
    }

    // 必要字段
    [
      'srcRoot',
      'destRoot'
    ].some((key) => {
      if (!config.alias[key]) {
        return reject(`${chalk.yellow(`config.alias.${key}`)} is necessary, please check your config: ${chalk.cyan(configPath)}`);
      }
    });

    // 必要字段 2
    if (!config.commit || !config.commit.hostname) {
      return reject(`${chalk.yellow(config.commit.hostname)} is necessary, please check your config: ${chalk.cyan(configPath)}`);
    }

    // 选填字段
    [
      'globalcomponents',
      'globallib',
      'destRoot',
      'imagesDest',
      'jsDest',
      'revDest',
      'jslibDest',
      'cssDest',
      'imagesDest',
      'htmlDest',
      'tplDest'
    ].some((key) => {
      if (!config.alias[key]) {
        config.alias[key] = config.alias.destRoot;
        log('msg', 'warn', `${chalk.yellow(`config.alias.${key}`)} is not set, auto fill it: ${chalk.cyan(`config.alias.${key} = '${config.alias.destRoot}'`)}`);
      }
    });

    next(config);
  };

  return new Promise(runner);
};

// 更新 packages
wOpzer.initPlugins = (config) => {
  if (!config.plugins || !config.plugins.length) {
    return Promise.resolve();
  }
  const iNodeModulePath = util.path.join(util.vars.BASE_PATH, 'node_modules');
  const installLists = [];

  config.plugins.forEach((str) => {
    let iDir = '';
    let iVer = '';
    const pathArr = str.split(/[\\/]+/);
    let pluginPath = '';
    let pluginName = '';
    if (pathArr.length > 1) {
      pluginName = pathArr.pop();
      pluginPath = pathArr.join('/');
    } else {
      pluginName = pathArr[0];
    }

    if (~pluginName.indexOf('@')) {
      iDir = pluginName.split('@')[0];
      iVer = pluginName.split('@')[1];
    } else {
      iDir = pluginName;
    }
    let iPath = path.join(iNodeModulePath, pluginPath, iDir);
    let iPkgPath = path.join(iPath, 'package.json');
    var iPkg;
    if (fs.existsSync(iPath) && fs.existsSync(iPkgPath)) {
      if (iVer) {
        iPkg = require(iPkgPath);
        if (iPkg.version != iVer) {
          installLists.push(str);
        }
      }
    } else {
      installLists.push(str);
    }
  });

  if (installLists.length) {
    var cmd = `npm install ${installLists.join(' ')} --loglevel http`;
    log('msg', 'info', `run cmd ${cmd}`);
    process.chdir(util.vars.BASE_PATH);

    log('end');
    return new Promise((next, reject) => {
      util.runCMD(cmd, (err) => {
        if (err) {
          return reject(err);
        }

        next();
      }, util.vars.BASE_PATH);
    });
  } else {
    return Promise.resolve();
  }
};

module.exports = wOpzer;

